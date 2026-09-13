import { Vehicle, RefuelRecord, AppUser } from '../types';

// Zero dados fictícios ou sementes de exemplo
export const INITIAL_VEHICLES: Vehicle[] = [];

export const INITIAL_REFUELS: RefuelRecord[] = [];

// Usuário legítimo ROOT do sistema
export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-root',
    name: 'Administrador Root',
    cpf: '059.958.485-85',
    email: 'tadeumotog5plus@gmail.com',
    phone: '(11) 98765-4321',
    role: 'Administrador',
    password: '250510',
    isRoot: true,
    vehicleAssigned: 'Todos',
    status: 'Ativo',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

