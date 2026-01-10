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

  @Interval(10000000) // Runs every 10 seconds (10000ms)
  async poll() {
    try {
      await this.ordersQueue.add(
        'faire.orders',
        {
          platform: 'faire',
        },
        {
          jobId: 'faire-orders-poll',
          removeOnComplete: true,
        },
      );
      await this.productsQueue.add(
        'faire.products',
        {
          platform: 'faire',
        },
        {
          jobId: 'faire-products-poll',
          removeOnComplete: true,
        },
      );
      this.logger.log('Queued Faire polling job');
    } catch (error) {
      this.logger.error('Failed to queue polling job', error);
    }
    try {
      await this.ordersQueue.add(
        'target.orders',
        {
          platform: 'target',
        },
        {
          jobId: 'target-orders-poll',
          removeOnComplete: true,
        },
      );
      await this.productsQueue.add(
        'target.products',
        {
          platform: 'target',
        },
        {
          jobId: 'target-orders-poll',
          removeOnComplete: true,
        },
      );
      this.logger.log('Queued Faire polling job');
    } catch (error) {
      this.logger.error('Failed to queue polling job', error);
    }
  }
}
