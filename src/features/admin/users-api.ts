import { apiRequest } from '@/lib/api/client';
export type AdminUser={id:string;email:string;displayName:string|null;status:'active'|'pending_activation'|'suspended'|'disabled';roles:string[];createdAt:string};
export function listAdminUsers(){return apiRequest<AdminUser[]>('/admin/users')}
export function createAdminUser(input:{email:string;displayName:string;role:'internal_team'|'admin'|'super_admin'}){return apiRequest('/admin/users',{method:'POST',body:input})}
export function setAdminUserActive(id:string,active:boolean){return apiRequest(`/admin/users/${id}/${active?'activate':'disable'}`,{method:'POST'})}
