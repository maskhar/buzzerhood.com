import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { AdminEmailController } from "./admin-email.controller.js";
@Module({ imports: [AuthModule], controllers: [AdminEmailController] })
export class AdminEmailModule {}
