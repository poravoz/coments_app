import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from "typeorm";
import { UserEntity } from "src/users/entities/user.entity";
import { Attachment } from "../interface/attachment.dto";

@ObjectType()
@Entity()
export class CommentEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    public id?: string;

    @Field(() => String, { nullable: true }) 
    @Column({ type: 'text', nullable: true })
    public comment?: string | null;

    @Field(() => UserEntity)
    @ManyToOne(() => UserEntity, user => user.comments, { 
        eager: true,
        onDelete: 'CASCADE' 
    })
    @JoinColumn({ name: 'userId' })
    public user: UserEntity;

    @Field(() => String, { nullable: true }) 
    @Column({ type: 'uuid', nullable: true })
    public parentId?: string | null;

    @Field(() => CommentEntity, { nullable: true })
    @ManyToOne(() => CommentEntity, comment => comment.children, { 
        onDelete: 'CASCADE' 
    })
    @JoinColumn({ name: 'parentId' })
    public parent?: CommentEntity;

    @Field(() => [CommentEntity], { nullable: true })
    @OneToMany(() => CommentEntity, comment => comment.parent, { 
        cascade: true 
    })
    public children?: CommentEntity[];

    @Field(() => Date)
    @CreateDateColumn()
    public createdAt: Date;

    @Field(() => [Attachment], { nullable: true })
    @Column({ type: 'json', nullable: true })
    public attachments?: Attachment[] | null;
}