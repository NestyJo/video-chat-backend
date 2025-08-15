import { Document, Model, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { AppError } from '../utils/AppError';

/**
 * Base service class with common CRUD operations
 */
export abstract class BaseService<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Create a new document
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      throw new AppError(`Failed to create ${this.model.modelName}`, 500);
    }
  }

  /**
   * Find document by ID
   */
  async findById(id: string, options?: QueryOptions): Promise<T | null> {
    try {
      return await this.model.findById(id, null, options);
    } catch (error) {
      throw new AppError(`Failed to find ${this.model.modelName}`, 500);
    }
  }

  /**
   * Find one document by filter
   */
  async findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null> {
    try {
      return await this.model.findOne(filter, null, options);
    } catch (error) {
      throw new AppError(`Failed to find ${this.model.modelName}`, 500);
    }
  }

  /**
   * Find multiple documents
   */
  async find(filter: FilterQuery<T> = {}, options?: QueryOptions): Promise<T[]> {
    try {
      return await this.model.find(filter, null, options);
    } catch (error) {
      throw new AppError(`Failed to find ${this.model.modelName}s`, 500);
    }
  }

  /**
   * Update document by ID
   */
  async updateById(
    id: string,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    try {
      return await this.model.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
        ...options,
      });
    } catch (error) {
      throw new AppError(`Failed to update ${this.model.modelName}`, 500);
    }
  }

  /**
   * Update one document by filter
   */
  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    try {
      return await this.model.findOneAndUpdate(filter, update, {
        new: true,
        runValidators: true,
        ...options,
      });
    } catch (error) {
      throw new AppError(`Failed to update ${this.model.modelName}`, 500);
    }
  }

  /**
   * Delete document by ID
   */
  async deleteById(id: string): Promise<T | null> {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      throw new AppError(`Failed to delete ${this.model.modelName}`, 500);
    }
  }

  /**
   * Delete one document by filter
   */
  async deleteOne(filter: FilterQuery<T>): Promise<T | null> {
    try {
      return await this.model.findOneAndDelete(filter);
    } catch (error) {
      throw new AppError(`Failed to delete ${this.model.modelName}`, 500);
    }
  }

  /**
   * Count documents
   */
  async count(filter: FilterQuery<T> = {}): Promise<number> {
    try {
      return await this.model.countDocuments(filter);
    } catch (error) {
      throw new AppError(`Failed to count ${this.model.modelName}s`, 500);
    }
  }

  /**
   * Check if document exists
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      const count = await this.model.countDocuments(filter);
      return count > 0;
    } catch (error) {
      throw new AppError(`Failed to check ${this.model.modelName} existence`, 500);
    }
  }

  /**
   * Paginated find
   */
  async findPaginated(
    filter: FilterQuery<T> = {},
    options: {
      page?: number;
      limit?: number;
      sort?: any;
      select?: string;
    } = {}
  ): Promise<{
    documents: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalDocuments: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      limit: number;
    };
  }> {
    const { page = 1, limit = 10, sort = { createdAt: -1 }, select } = options;

    try {
      const skip = (page - 1) * limit;

      const [documents, total] = await Promise.all([
        this.model
          .find(filter)
          .select(select)
          .sort(sort)
          .skip(skip)
          .limit(limit),
        this.model.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        documents,
        pagination: {
          currentPage: page,
          totalPages,
          totalDocuments: total,
          hasNextPage,
          hasPrevPage,
          limit,
        },
      };
    } catch (error) {
      throw new AppError(`Failed to find paginated ${this.model.modelName}s`, 500);
    }
  }
}