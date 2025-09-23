import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface StatusChange {
  status: string;
  timestamp: string;
}

@Injectable()
export class ReviewsService implements OnModuleInit {
  private statusChangesFile: string;
  private staticReviewsFile: string;
  private statusChanges: Map<number, StatusChange> = new Map();
  private staticReviews: any[] = [];

  constructor() {
    this.statusChangesFile = path.join(process.cwd(), 'data', 'review-status-changes.json');
    this.staticReviewsFile = path.join(process.cwd(), 'data', 'static-reviews.json');
  }

  async onModuleInit() {
    await this.loadStaticReviews();
    await this.loadStatusChanges();
  }

  private async loadStaticReviews() {
    try {
      if (fs.existsSync(this.staticReviewsFile)) {
        const data = fs.readFileSync(this.staticReviewsFile, 'utf8');
        this.staticReviews = JSON.parse(data);
      } else {
        console.warn('Static reviews file not found, using empty array');
        this.staticReviews = [];
      }
    } catch (error) {
      console.warn('Failed to load static reviews:', error);
      this.staticReviews = [];
    }
  }

  private async loadStatusChanges() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.statusChangesFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.statusChangesFile)) {
        const data = JSON.parse(fs.readFileSync(this.statusChangesFile, 'utf8'));
        
        // Handle migration from old format (string) to new format (object)
        Object.entries(data).forEach(([id, change]) => {
          const reviewId = parseInt(id);
          if (typeof change === 'string') {
            // Old format: just status string
            this.statusChanges.set(reviewId, { 
              status: change, 
              timestamp: new Date().toISOString() // Use current time as fallback
            });
          } else {
            // New format: object with status and timestamp
            this.statusChanges.set(reviewId, change as StatusChange);
          }
        });
        
        // Apply status changes to static reviews
        this.statusChanges.forEach((change, id) => {
          const review = this.staticReviews.find(r => r.id === id);
          if (review) {
            review.status = change.status;
            // Add publishedAt timestamp if the review is published
            if (change.status === 'published') {
              (review as any).publishedAt = change.timestamp;
            }
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load review status changes:', error);
    }
  }

  private async saveStatusChanges() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.statusChangesFile);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const data = Object.fromEntries(this.statusChanges);
      fs.writeFileSync(this.statusChangesFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('Failed to save review status changes:', error);
    }
  }

  findAll() {
    return this.staticReviews;
  }

  async findOne(id: string) {
    const review = this.staticReviews.find(r => r.id.toString() === id);
    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }
    return review;
  }

  async updateStatus(id: string, status: 'awaiting' | 'published') {
    const review = this.staticReviews.find(r => r.id.toString() === id);
    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    // Update the review status
    review.status = status;
    
    // Store the status change with timestamp for persistence
    const timestamp = new Date().toISOString();
    this.statusChanges.set(review.id, { status, timestamp });
    
    // Add publishedAt timestamp if the review is published
    if (status === 'published') {
      (review as any).publishedAt = timestamp;
    } else {
      // Remove publishedAt if unpublished
      delete (review as any).publishedAt;
    }
    
    // Save to file
    await this.saveStatusChanges();
    
    return review;
  }
}
