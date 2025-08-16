import { DataTypes, Model, Sequelize } from 'sequelize';

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MeetingType = 'one_on_one' | 'group' | 'presentation' | 'workshop' | 'other';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface MeetingAttributes {
  id?: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  location?: string;
  meetingLink?: string;
  meetingType: MeetingType;
  status: MeetingStatus;
  maxParticipants?: number;
  isRecurring: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceEndDate?: Date;
  organizerId: number;
  // Agora-specific fields
  agoraChannelName?: string;
  agoraAppId?: string;
  meetingPassword?: string;
  isPasswordProtected: boolean;
  allowGuestAccess: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MeetingCreationAttributes extends Omit<MeetingAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Meeting extends Model<MeetingAttributes, MeetingCreationAttributes> implements MeetingAttributes {
  public id!: number;
  public title!: string;
  public description?: string;
  public startTime!: Date;
  public endTime!: Date;
  public timezone!: string;
  public location?: string;
  public meetingLink?: string;
  public meetingType!: MeetingType;
  public status!: MeetingStatus;
  public maxParticipants?: number;
  public isRecurring!: boolean;
  public recurrenceType?: RecurrenceType;
  public recurrenceEndDate?: Date;
  public organizerId!: number;
  // Agora-specific fields
  public agoraChannelName?: string;
  public agoraAppId?: string;
  public meetingPassword?: string;
  public isPasswordProtected!: boolean;
  public allowGuestAccess!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public getDuration(): number {
    return this.endTime.getTime() - this.startTime.getTime();
  }

  public isUpcoming(): boolean {
    return this.startTime > new Date();
  }

  public isOngoing(): boolean {
    const now = new Date();
    return this.startTime <= now && this.endTime > now;
  }

  public canBeModified(): boolean {
    return this.status === 'scheduled' && this.isUpcoming();
  }

  public requiresPassword(): boolean {
    return this.isPasswordProtected && !!this.meetingPassword;
  }

  public validatePassword(inputPassword: string): boolean {
    return this.meetingPassword === inputPassword;
  }

  public getJoinInfo(): {
    meetingId: number;
    agoraChannelName?: string;
    agoraAppId?: string;
    requiresPassword: boolean;
    allowGuestAccess: boolean;
  } {
    return {
      meetingId: this.id,
      agoraChannelName: this.agoraChannelName,
      agoraAppId: this.agoraAppId,
      requiresPassword: this.requiresPassword(),
      allowGuestAccess: this.allowGuestAccess,
    };
  }

  // Static methods
  public static async findByOrganizer(organizerId: number): Promise<Meeting[]> {
    return this.findAll({ 
      where: { organizerId },
      order: [['startTime', 'ASC']]
    });
  }

  public static async findUpcoming(limit: number = 10): Promise<Meeting[]> {
    return this.findAll({
      where: {
        startTime: {
          [require('sequelize').Op.gt]: new Date()
        },
        status: 'scheduled'
      },
      order: [['startTime', 'ASC']],
      limit
    });
  }

  public static async findByDateRange(startDate: Date, endDate: Date): Promise<Meeting[]> {
    return this.findAll({
      where: {
        startTime: {
          [require('sequelize').Op.between]: [startDate, endDate]
        }
      },
      order: [['startTime', 'ASC']]
    });
  }
}

export const initMeetingModel = (sequelize: Sequelize): typeof Meeting => {
  Meeting.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          len: [3, 200],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 1000],
        },
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
          isAfter: {
            args: new Date().toISOString(),
            msg: 'Start time must be in the future'
          }
        },
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
          isAfterStartTime(value: Date) {
            if (value <= this.startTime) {
              throw new Error('End time must be after start time');
            }
          }
        },
      },
      timezone: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'UTC',
        validate: {
          len: [1, 50],
        },
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: [0, 255],
        },
      },
      meetingLink: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: true,
          len: [0, 500],
        },
      },
      meetingType: {
        type: DataTypes.ENUM('one_on_one', 'group', 'presentation', 'workshop', 'other'),
        allowNull: false,
        defaultValue: 'group',
      },
      status: {
        type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      maxParticipants: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 1000,
        },
      },
      isRecurring: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      recurrenceType: {
        type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly'),
        allowNull: true,
        defaultValue: 'none',
      },
      recurrenceEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: true,
        },
      },
      organizerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      agoraChannelName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
          len: [1, 100],
        },
      },
      agoraAppId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: [1, 100],
        },
      },
      meetingPassword: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
          len: [4, 50],
        },
      },
      isPasswordProtected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      allowGuestAccess: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'Meeting',
      tableName: 'meetings',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['organizer_id']
        },
        {
          fields: ['start_time']
        },
        {
          fields: ['status']
        },
        {
          fields: ['start_time', 'end_time']
        }
      ],
    }
  );

  return Meeting;
};