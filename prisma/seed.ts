import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";

const adaptadorPostgres = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter: adaptadorPostgres });

const roles = [
    {
        name: 'RECEPTIONIST',
        description: 'Recepcionista responsável pelo check-in e check-out de visitantes',
    },
    {
        name: 'ADMIN',
        description: 'Administrador do sistema',
    },
];

const permissions = [
    { code: 'VISITOR_CREATE', description: 'Cadastrar visitante' },
    { code: 'VISITOR_VIEW', description: 'Visualizar dados de visitantes' },
    { code: 'VISITOR_VIEW_SENSITIVE', description: 'Visualizar dados sensíveis do visitante (CPF/documento)' },
    { code: 'VISITOR_UPDATE', description: 'Editar dados de visitante' },
    { code: 'VISITOR_DELETE', description: 'Excluir visitante' },

    { code: 'VISIT_CREATE', description: 'Registrar entrada (check-in) de visita' },
    { code: 'VISIT_CHECKOUT', description: 'Registrar saída (check-out) de visita' },
    { code: 'VISIT_VIEW', description: 'Visualizar visitas' },
    { code: 'VISIT_UPDATE', description: 'Editar dados de uma visita' },
    { code: 'VISIT_DELETE', description: 'Excluir visita' },

    { code: 'USER_CREATE', description: 'Criar usuário do sistema' },
    { code: 'USER_LIST', description: 'Listar usuários' },
    { code: 'USER_UPDATE_OWN', description: 'Editar próprio perfil' },
    { code: 'USER_CHANGE_ROLE', description: 'Alterar role de usuário' },
    { code: 'USER_DELETE', description: 'Excluir usuário' },

    { code: 'ROLE_PERMISSION_VIEW', description: 'Visualizar permissões de roles' },
    { code: 'ROLE_PERMISSION_UPDATE', description: 'Alterar permissões de roles' },
];

// Cria as roles no banco. O upsert deixa o seed seguro pra rodar de novo:
// se a role já existe, ele só atualiza a descrição em vez de duplicar.
async function criarRoles() {
    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: { description: role.description },
            create: role,
        });
    }
}

// Mesma ideia das roles: cria cada permissão ou atualiza a existente.
async function criarPermissions() {
    for (const permission of permissions) {
        await prisma.permission.upsert({
            where: { code: permission.code },
            update: { description: permission.description },
            create: permission,
        });
    }
}

// Liga uma role a uma lista de permissões (pelo código).
async function assignPermissions(
    roleName: string,
    permissionCodes: string[],
) {
    const role = await prisma.role.findUnique({
        where: { name: roleName },
    });

    if (!role) {
        throw new Error(`Role ${roleName} não encontrada`);
    }

    const permissions = await prisma.permission.findMany({
        where: {
            code: {
                in: permissionCodes,
            },
        },
    });

    for (const permission of permissions) {
        await prisma.rolePermission.upsert({
            where: {
                fk_roleId_fk_permissionId: {
                    fk_roleId: role.id_role,
                    fk_permissionId: permission.id_permission,
                },
            },
            update: {},
            create: {
                fk_roleId: role.id_role,
                fk_permissionId: permission.id_permission,
            },
        });
    }
}

// Sem isso, ninguém consegue logar pra criar o primeiro usuário: a rota
// POST /users exige um token de quem já tem a permissão USER_CREATE, e sem
// nenhum usuário cadastrado essa permissão nunca chega a existir em token
// nenhum. O upsert com "update: {}" nunca reseta a senha se já existir.
async function criarAdminInicial() {
    const email = process.env.ADMIN_EMAIL!;
    const senha = process.env.ADMIN_PASSWORD!;

    const roleAdmin = await prisma.role.findUnique({ where: { name: "ADMIN" } });

    if (!roleAdmin) {
        throw new Error("Role ADMIN não encontrada");
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password: senhaCriptografada,
            fullName: "Administrador",
            fk_roleId: roleAdmin.id_role,
        },
    });

    console.log(`Admin inicial disponível: ${email} / ${senha} (troque a senha após o primeiro login)`);
}

// Ponto de entrada. Tudo fica aqui dentro porque o projeto é CommonJS
// e não deixa usar await direto no topo do arquivo.
async function main() {
    await criarRoles();
    await criarPermissions();

    // Recepcionista: opera o dia a dia de check-in/check-out, mas não vê
    // dados sensíveis do visitante nem gerencia usuários/permissões.
    await assignPermissions('RECEPTIONIST', [
        'VISITOR_CREATE',
        'VISITOR_VIEW',
        'VISITOR_UPDATE',
        'VISIT_CREATE',
        'VISIT_CHECKOUT',
        'VISIT_VIEW',
        'USER_UPDATE_OWN',
    ]);

    // Admin: acesso completo, incluindo dados sensíveis e gestão de usuários/roles.
    await assignPermissions('ADMIN', [
        'VISITOR_CREATE',
        'VISITOR_VIEW',
        'VISITOR_VIEW_SENSITIVE',
        'VISITOR_UPDATE',
        'VISITOR_DELETE',
        'VISIT_CREATE',
        'VISIT_CHECKOUT',
        'VISIT_VIEW',
        'VISIT_UPDATE',
        'VISIT_DELETE',
        'USER_CREATE',
        'USER_LIST',
        'USER_UPDATE_OWN',
        'USER_CHANGE_ROLE',
        'USER_DELETE',
        'ROLE_PERMISSION_VIEW',
        'ROLE_PERMISSION_UPDATE',
    ]);

    await criarAdminInicial();

    console.log('Seed concluído com sucesso.');
}

// Roda o seed, mostra qualquer erro e sempre fecha a conexão com o banco.
main()
    .catch((erro) => {
        console.error(erro);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
