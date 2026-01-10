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

  @Interval(10000) // Runs every 10 seconds (10000ms)
  async pollOrders() {
    this.logger.log('Initialized Order Polling Service');

    await this.ordersQueue.add('faire.orders', {
      platform: 'FAIRE',
    });
  }
}
