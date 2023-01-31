import { ConfigModule } from "@nestjs/config";
import { ExpressRequest } from "@app/types/expressRequest.interface";
import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Response } from "express";
import { verify } from "jsonwebtoken";
import { UserService } from "../user.service";
ConfigModule.forRoot();

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) { }

  async use(req: ExpressRequest, _: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      req.user = null
      next()
      return
    }

    const token = req.headers.authorization.split(' ')[1];

    try {
      const decode = verify(token, process.env.JWT_SECRET) as { id: number, username: string, email: string };
      const user = await this.userService.findById(decode.id)
      req.user = user
      next();
    } catch (error) {
      req.user = null
      next()
    }
  }
}
