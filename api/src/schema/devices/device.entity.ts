import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field, registerEnumType } from 'type-graphql';
import { IsDefined } from 'class-validator';

export enum DeviceType {
  lamp = 'lamp',
}

registerEnumType(DeviceType, {
  name: 'DeviceType',
  description: 'device type',
});

export enum Mode {
  off = 'off',
  colors = 'colors',
  warm = 'warm',
  thinkingOfYou = 'thinking_of_you',
}

registerEnumType(Mode, {
  name: 'ModeType',
  description: 'selectable modes'
});

@ObjectType({ description: 'device object' })
@Entity({ name: 'device' })
export default class Device {
  @Field()
  @PrimaryGeneratedColumn({ type: 'uuid' })
  id: string;

  @Field({ description: 'is device activated' })
  @Column({ type: 'boolean' })
  @IsDefined()
  activated: boolean;

  @Field({ description: 'activation code' })
  @Column({ type: 'text' })
  @IsDefined()
  activationCode: string;

  @Field({ description: 'device type' })
  @Column({ type: 'enum', enum: DeviceType })
  @IsDefined()
  type: DeviceType;

  @Field({ description: 'current mode' })
  @Column({ type: 'enum', enum: Mode })
  @IsDefined()
  mode: Mode;

  @Field({ description: 'owner' })
  @Column({ type: 'int' })
  @IsDefined()
  owner: number;

  @Field({ description: 'device name' })
  @Column({ type: 'text' })
  @IsDefined()
  name: string;

  @Field({ description: 'id of user that can send thinking of you commands (and vice-versa)' })
  @Column({ type: 'int' })
  @IsDefined()
  connection: number;
}
