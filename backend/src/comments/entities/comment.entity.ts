import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { UserEntity } from "../../users/entities/user.entity";

@Entity()
export class CommentEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    public comment: string;

    @ManyToOne(() => UserEntity, user => user.comments, {onDelete: 'CASCADE'})
    public user: UserEntity;
}

