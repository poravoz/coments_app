import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from "typeorm";
import { UserEntity } from "../../users/entities/user.entity";

@Entity()
export class CommentEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    public comment: string;

    @CreateDateColumn({ type: 'timestamp' })
    public createdAt: Date;

    @ManyToOne(() => UserEntity, user => user.comments, {onDelete: 'CASCADE'})
    public user: UserEntity;
}

