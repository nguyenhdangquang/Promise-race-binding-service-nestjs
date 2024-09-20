import {BadRequestException, Injectable} from '@nestjs/common';
import axios from "axios";

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  delay(t: number) {
    return new Promise(resolve => setTimeout(resolve, t));
  }

  async callServer(url: string): Promise<any> {
    /*open comment if try to test API /find-server throw error request time out after 5s*/
    // await this.delay(5000);
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error: any) {
      throw new BadRequestException(`Error calling server ${url}: ${error.message}`);
    }
  }

  async findServer(): Promise<{
    url: string,
    priority: number
  }> {
    const online: {url: string, priority: number}[] = [];
    const offline: {url: string, priority: number}[] = [];

    const servers = [
      {
        "url": "https://does-not-work.perfume.new",
        "priority": 1
      },
      {
        "url": "https://gitlab.com",
        "priority": 4
      },
      {
        "url": "http://app.scnt.me",
        "priority": 3
      },
      {
        "url": "https://offline.scentronix.com",
        "priority": 2
      }
    ]

    try {
      await Promise.race([Promise.all(servers.map(async server => {
        try {
          const res = await this.callServer(server.url);
          res && online.push({ ...server })
          return online;
        } catch (error: any) {
          return offline.push({ ...server })
        }
      })), new Promise<any[]>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Promise.all() timed out after 5 seconds'));
        }, 5000);
      })]);
    } catch (error) {
      throw new BadRequestException("Get request timed out after 5 seconds")
    }

    if (offline?.length === servers.length) {
      throw new BadRequestException('All Servers offline!')
    }

    const serverMatchingCondition = online.sort((a, b) => a?.priority - b?.priority )[0];

    return {
      url: serverMatchingCondition?.url ?? '',
      priority: serverMatchingCondition?.priority ?? 0
    }
  }
}
