import { DataTypes, Model, Sequelize } from 'sequelize';

export type ParticipantStatus = 'invited' | 'accepted' | 'declined' | 'tentative' | 'no_response';
export type ParticipantRole = 'organizer' | 'presenter' | 'attendee' | 'optional';

export interface MeetingParticipantAttributes {
  id?: number;
  meetingId: number;
  userId: number;
  email?: string; // For external participants
  name?: string; // For external participants
  status: ParticipantStatus;
  role: ParticipantRole;
  joinedAt?: Date;
  leftAt?: Date;
  responseDate?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MeetingParticipantCreationAttributes extends Omit<MeetingParticipantAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class MeetingParticipant extends Model<MeetingParticipantAttributes, MeetingParticipantCreationAttributes> implements MeetingParticipantAttributes {
  public id!: number;
  public meetingId!: number;
  public userId!: number;
  public email?: string;
  public name?: string;
  public status!: ParticipantStatus;
  public role!: ParticipantRole;
  public joinedAt?: Date;
  public leftAt?: Date;
  public responseDate?: Date;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public hasResponded(): boolean {
    return this.status !== 'invited' && this.status !== 'no_response';
  }

  public isAttending(): boolean {
    return this.status === 'accepted' || this.status === 'tentative';
  }

  public getDuration(): number | null {
    if (this.joinedAt && this.leftAt) {
      return this.leftAt.getTime() - this.joinedAt.getTime();
    }
    return null;
  }

  // Static methods
  public static async findByMeeting(meetingId: number): Promise<MeetingParticipant[]> {
    return this.findAll({ 
      where: { meetingId },
      order: [['role', 'ASC'], ['createdAt', 'ASC']]
    });
  }

  public static async findByUser(userId: number): Promise<MeetingParticipant[]> {
    return this.findAll({ 
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
  }

  public static async getAcceptedCount(meetingId: number): Promise<number> {
    return this.count({
      where: {
        meetingId,
        status: 'accepted'
      }
    });
  }

  public static async getResponseStats(meetingId: number): Promise<{
    total: number;
    accepted: number;
    declined: number;
    tentative: number;
    noResponse: number;
  }> {
    const participants = await this.findAll({
      where: { meetingId },
      attributes: ['status']
    });

    const stats = {
      total: participants.length,
      accepted: 0,
      declined: 0,
      tentative: 0,
      noResponse: 0
    };

    participants.forEach(p => {
      switch (p.status) {
        case 'accepted':
          stats.accepted++;
          break;
        case 'declined':
          stats.declined++;
          break;
        case 'tentative':
          stats.tentative++;
          break;
        default:
          stats.noResponse++;
      }
    });

    return stats;
  }
}

export const initMeetingParticipantModel = (sequelize: Sequelize): typeof MeetingParticipant => {
  MeetingParticipant.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      meetingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'meetings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: [1, 100],
        },
      },
      status: {
        type: DataTypes.ENUM('invited', 'accepted', 'declined', 'tentative', 'no_response'),
        allowNull: false,
        defaultValue: 'invited',
      },
      role: {
        type: DataTypes.ENUM('organizer', 'presenter', 'attendee', 'optional'),
        allowNull: false,
        defaultValue: 'attendee',
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      leftAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      responseDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 500],
        },
      },
    },
    {
      sequelize,
      modelName: 'MeetingParticipant',
      tableName: 'meeting_participants',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['meeting_id']
        },
        {
          fields: ['user_id']
        },
        {
          fields: ['status']
        },
        {
          unique: true,
          fields: ['meeting_id', 'user_id']
        }
      ],
    }
  );

  return MeetingParticipant;
};