import{Module}from'@nestjs/common';import{AuthModule}from'../auth/auth.module.js';import{AdminPartnersController}from'./admin-partners.controller.js';import{AdminPartnersService}from'./admin-partners.service.js';
@Module({imports:[AuthModule],controllers:[AdminPartnersController],providers:[AdminPartnersService]})export class AdminPartnersModule{}
