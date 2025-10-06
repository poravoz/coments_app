import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn } from "typeorm";
import { UserEntity } from "src/users/entities/user.entity";

export interface Attachment {
  type: 'image' | 'video' | 'text';
  url: string;
}

@Entity() 
export class CommentEntity {
    @PrimaryGeneratedColumn('uuid')
    public id?: string;

    @Column({ nullable: true })
    public comment?: string;

    @ManyToOne(() => UserEntity, user => user.comments, { 
        eager: true,
        onDelete: 'CASCADE' 
    })
    @JoinColumn({ name: 'userId' })
    public user: UserEntity;

    @Column({ type: 'uuid', nullable: true })
    public parentId?: string | null;

    @ManyToOne(() => CommentEntity, comment => comment.children, { 
        onDelete: 'CASCADE' 
    })
    @JoinColumn({ name: 'parentId' })
    public parent?: CommentEntity;

    @OneToMany(() => CommentEntity, comment => comment.parent, { 
        cascade: true 
    })
    public children?: CommentEntity[];

    @CreateDateColumn()
    public createdAt: Date;

    @Column({ type: 'json', nullable: true })
    public attachments?: Attachment[];
}