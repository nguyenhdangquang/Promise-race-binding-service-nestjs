import {AppService} from "./app.service";
import { Test, TestingModule } from '@nestjs/testing';
import {AppController} from "./app.controller";
import {BadRequestException} from "@nestjs/common";

describe('App Service', () => {
    let appService: AppService;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
        }).compile();
        appService = app.get<AppService>(AppService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Service findServer', () => {
        it('should return server which online and lowest priority', async () => {
            const axiosResMock = {
                data: 'success',
                status: 200,
                statusText: '',
                headers: {},
                config: {},
            };
            jest
                .spyOn(appService, 'callServer')
                .mockResolvedValueOnce(() => Promise.resolve(axiosResMock))
                .mockRejectedValueOnce(new BadRequestException("error"))
                .mockResolvedValueOnce(() => Promise.resolve(axiosResMock))
                .mockResolvedValueOnce(() => Promise.resolve(axiosResMock));

            const result = await appService.findServer();

            expect(result).toEqual({
                url: "https://does-not-work.perfume.new",
                priority: 1
            });
        });
        it('should throw error when all server offline', async () => {
            jest
                .spyOn(appService, 'callServer')
                .mockRejectedValueOnce(new BadRequestException("error"))
                .mockRejectedValueOnce(new BadRequestException("error"))
                .mockRejectedValueOnce(new BadRequestException("error"))
                .mockRejectedValueOnce(new BadRequestException("error"));

            await expect(appService.findServer()).rejects.toThrow(new BadRequestException('All Servers offline!'));
        });
        it('should return server online no matter lowest priority when other servers offline', async () => {
            const axiosResMock = {
                data: 'success',
                status: 200,
                statusText: '',
                headers: {},
                config: {},
            };
            jest
                .spyOn(appService, 'callServer')
                .mockRejectedValueOnce(new BadRequestException("error"))
                .mockResolvedValueOnce(() => Promise.resolve(axiosResMock))
                .mockRejectedValueOnce(new BadRequestException("error"))
                .mockRejectedValueOnce(new BadRequestException("error"));

            const result = await appService.findServer();

            expect(result).toEqual({
                url: "https://gitlab.com",
                priority: 4
            });
        });
        it('should throw error when get request get timeout 5s', async () => {
            const axiosResMock = {
                data: 'success',
                status: 200,
                statusText: '',
                headers: {},
                config: {},
            };
            jest
                .spyOn(appService, 'callServer')
                .mockImplementationOnce(() => Promise.resolve(new Promise(resolve => setTimeout(resolve,6000))))
            jest
                .spyOn(appService, 'callServer')
                .mockResolvedValueOnce(() => Promise.resolve(axiosResMock))
                .mockResolvedValueOnce(() => Promise.resolve(axiosResMock))
                .mockResolvedValueOnce(() => Promise.resolve(axiosResMock))
            await expect(appService.findServer()).rejects.toThrow(new BadRequestException("Get request timed out after 5 seconds"));
        }, 10000);
    });
});

