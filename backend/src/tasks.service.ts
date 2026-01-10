import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Queue } from 'bullmq';

@Injectable()
export class TasksService {
  constructor(
    @InjectQueue('products') private readonly productsQueue: Queue,
    @InjectQueue('orders') private readonly ordersQueue: Queue,
  ) {}
  private readonly logger = new Logger(TasksService.name);

  @Interval(100000) // Runs every 10 seconds (10000ms)
  async pollOrders() {
    try {
      await this.ordersQueue.add(
        'faire.orders',
        {
          platform: 'FAIRE',
        },
        {
          jobId: 'faire-orders-poll',
          removeOnComplete: true,
        },
      );
      this.logger.log('Queued Faire order polling job');
    } catch (error) {
      this.logger.error('Failed to queue order polling job', error);
    }
  }
}
