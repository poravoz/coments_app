import { CommentEntity } from "src/comments/entities/comment.entity";
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Exclude } from 'class-transformer';

@Entity() 
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    public id?: string;

    @Column({ unique: true})
    public email: string;

    @Column()
    public name: string;

    @Column()
    public password?: string;

    @OneToMany(() => CommentEntity, comment => comment.user, { cascade: true })
    @Exclude() 
    public comments?: CommentEntity[];

    @Column({ type: 'varchar', nullable: true })
    public currentHashedRefreshToken?: string | null;
}