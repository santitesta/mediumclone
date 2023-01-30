import { ConfigModule } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "@app/user/dto/createUser.dto";
import { UserEntity } from "@app/user/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { sign } from "jsonwebtoken";
import { UserResponseInterface } from "./types/userResponse.interface";
import { HttpException } from "@nestjs/common/exceptions";
import { HttpStatus } from "@nestjs/common/enums";
import { LoginUserDto } from "./dto/loginUser.dto";
import { compare } from "bcrypt";
import { UpdateUserDto } from "./dto/updateUser.dto";
ConfigModule.forRoot();

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) { }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const userByEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    })
    const userByUsername = await this.userRepository.findOne({
      where: { username: createUserDto.username }
    })
    if (userByEmail || userByUsername) {
      throw new HttpException(
        'Email or username are taken',
        HttpStatus.UNPROCESSABLE_ENTITY)
    }
    const newUser = new UserEntity();
    Object.assign(newUser, createUserDto);
    return await this.userRepository.save(newUser);
  }

  async findById(id: number): Promise<UserEntity> {
    return this.userRepository.findOne({ where: { id } })
  }

  async login(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: {
        email: loginUserDto.email
      },
      select: ['id', 'username', 'email', 'bio', 'image', 'password']
    })

    if (!user) {
      throw new HttpException('Credentials are not valid', HttpStatus.UNPROCESSABLE_ENTITY)
    }

    const isPasswordCorrect = await compare(loginUserDto.password, user.password)

    if (!isPasswordCorrect) {
      throw new HttpException('Credentials are not valid', HttpStatus.UNPROCESSABLE_ENTITY)
    }

    delete user.password;
    return user;
  }

  async updateUser(userId: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findById(userId);
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  generateJwt(user: UserEntity): string {
    console.log('Full user lets see: ', user)
    return sign({
      id: user.id,
      username: user.username,
      email: user.email
    }, process.env.JWT_SECRET)
  }

  buildUserResponse(user: UserEntity): UserResponseInterface {
    return {
      user: {
        ...user,
        token: this.generateJwt(user)
      }
    }
  }
}