import {Module}from'@nestjs/common';import{AuthModule}from'../auth/auth.module.js';import{PartnerOnboardingController}from'./partner-onboarding.controller.js';import{PartnerOnboardingService}from'./partner-onboarding.service.js';
@Module({imports:[AuthModule],controllers:[PartnerOnboardingController],providers:[PartnerOnboardingService]})export class PartnerOnboardingModule{}
