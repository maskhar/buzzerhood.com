import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { EmailService } from "../../common/email/email.service.js";
import { PartnersManageGuard } from "../../common/security/partners-manage.guard.js";
import { ZodValidationPipe } from "../../common/validation/zod-validation.pipe.js";
import { AuthGuard } from "../auth/auth.guard.js";
import { emailTestSchema, type EmailTestInput } from "./admin-email.schemas.js";

@ApiTags("admin-email")
@ApiBearerAuth()
@UseGuards(AuthGuard, PartnersManageGuard)
@Controller("admin/email")
export class AdminEmailController {
  constructor(private readonly email: EmailService) {}
  @Get("diagnostics") diagnostics() {
    return this.email.diagnostics();
  }
  @Post("test")
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  test(@Body(new ZodValidationPipe(emailTestSchema)) input: EmailTestInput) {
    return this.email.sendTestEmail(input.recipient);
  }
}
