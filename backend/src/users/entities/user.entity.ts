// src/users/entities/user.entity.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { CommentEntity } from "src/comments/entities/comment.entity";

@ObjectType()
@Entity() 
export class UserEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    public id?: string;

    @Field(() => String)
    @Column({ unique: true })
    public email: string;

    @Field(() => String)
    @Column()
    public name: string;

    @Column()
    public password?: string;

    @Field(() => String, { nullable: true })
    @Column({ nullable: true, type: 'varchar' })
    public avatarUrl?: string | null;

    @Field(() => [CommentEntity], { nullable: true })
    @OneToMany(() => CommentEntity, comment => comment.user, { 
        cascade: true,
        onDelete: 'CASCADE'
    })
    public comments?: CommentEntity[];

    @Column({ type: 'varchar', nullable: true })
    public currentHashedRefreshToken?: string | null;
}