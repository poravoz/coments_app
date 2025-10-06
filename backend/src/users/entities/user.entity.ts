import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { CommentEntity } from "src/comments/entities/comment.entity";
import { Exclude } from 'class-transformer';
import {IsOptional} from "class-validator";
@Entity() 
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    public id?: string;

    @Column({ unique: true })
    public email: string;

    @Column()
    public name: string;

    @Column()
    public password?: string;

    @Column({ nullable: true, type: 'varchar', })
    @IsOptional()
    public avatarUrl?: string | null;

    @OneToMany(() => CommentEntity, comment => comment.user, { 
        cascade: true,
        onDelete: 'CASCADE'
    })
    @Exclude() 
    public comments?: CommentEntity[];

    @Column({ type: 'varchar', nullable: true })
    public currentHashedRefreshToken?: string | null;
}