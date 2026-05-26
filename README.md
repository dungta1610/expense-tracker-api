# Expense Tracker API

> **Mục đích:** Tài liệu học tập — hướng dẫn từng bước xây dựng một REST API backend bằng NestJS từ đầu đến cuối.

---

## Mục lục

1. [Tổng quan project](#1-tổng-quan-project)
2. [Tech stack](#2-tech-stack)
3. [Kiến trúc và cấu trúc thư mục](#3-kiến-trúc-và-cấu-trúc-thư-mục)
4. [Cài đặt và chạy project](#4-cài-đặt-và-chạy-project)
5. [Hiểu NestJS từ gốc rễ](#5-hiểu-nestjs-từ-gốc-rễ)
6. [Database với Prisma ORM](#6-database-với-prisma-orm)
7. [Authentication — JWT + Refresh Token](#7-authentication--jwt--refresh-token)
8. [Validation với DTO](#8-validation-với-dto)
9. [Guards, Interceptors, Filters](#9-guards-interceptors-filters)
10. [Danh sách API Endpoints](#10-danh-sách-api-endpoints)
11. [Luồng dữ liệu tổng thể](#11-luồng-dữ-liệu-tổng-thể)
12. [Câu hỏi thường gặp khi học](#12-câu-hỏi-thường-gặp-khi-học)

---

## 1. Tổng quan project

**Expense Tracker API** là hệ thống quản lý thu chi cá nhân. Người dùng có thể:

- Đăng ký / đăng nhập tài khoản
- Tạo và quản lý **ví tiền** (ví tiền mặt, ví ngân hàng...)
- Tạo **danh mục** thu/chi (ăn uống, đi lại, lương...)
- Ghi nhận **giao dịch** thu/chi (balance ví tự động cập nhật)
- Xem **báo cáo** tổng hợp theo tháng, xu hướng 6 tháng

---

## 2. Tech stack

| Công nghệ | Vai trò |
|---|---|
| **NestJS** | Framework backend chính (Node.js + TypeScript) |
| **TypeScript** | Ngôn ngữ lập trình (type-safe) |
| **Prisma ORM** | Tương tác với database, type-safe query |
| **PostgreSQL** | Database quan hệ |
| **JWT** | Xác thực người dùng (stateless) |
| **Bcrypt** | Hash password trước khi lưu DB |
| **Class Validator** | Validate dữ liệu đầu vào từ client |
| **Swagger** | Tự động sinh tài liệu API có giao diện test |

---

## 3. Kiến trúc và cấu trúc thư mục

### Tại sao NestJS dùng kiến trúc module?

NestJS lấy cảm hứng từ Angular — tổ chức code thành các **module độc lập**, mỗi module chịu trách nhiệm một tính năng. Điều này giúp code dễ bảo trì, dễ test và dễ mở rộng.

```
expense-tracker-api/
│
├── prisma/
│   └── schema.prisma           ← Định nghĩa cấu trúc database
│
├── src/
│   ├── main.ts                 ← Điểm khởi động ứng dụng
│   ├── app.module.ts           ← Module gốc, import tất cả module khác
│   │
│   ├── common/                 ← Code dùng chung (không thuộc module nào)
│   │   ├── filters/            ← Xử lý và format lỗi
│   │   ├── interceptors/       ← Biến đổi response trước khi trả về
│   │   └── types/              ← Định nghĩa TypeScript types
│   │
│   ├── prisma/                 ← Module kết nối database
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── auth/                   ← Module đăng ký / đăng nhập
│   │   ├── decorators/         ← @CurrentUser(), @Public()
│   │   ├── dto/                ← Validate dữ liệu request
│   │   ├── guards/             ← Bảo vệ route (yêu cầu JWT)
│   │   ├── strategies/         ← Logic xác thực JWT
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── users/                  ← Module quản lý thông tin user
│   ├── wallets/                ← Module quản lý ví tiền
│   ├── categories/             ← Module quản lý danh mục
│   ├── transactions/           ← Module ghi nhận giao dịch
│   └── reports/                ← Module báo cáo thống kê
│
├── .env.example                ← Mẫu biến môi trường
├── package.json
└── tsconfig.json
```

### Nguyên tắc tổ chức: mỗi module có 3 thành phần cốt lõi

```
wallets/
├── wallets.controller.ts   ← Nhận request, trả response (KHÔNG chứa business logic)
├── wallets.service.ts      ← Toàn bộ business logic, tương tác DB
└── wallets.module.ts       ← Khai báo và wire các thành phần lại
```

---

## 4. Cài đặt và chạy project

### Yêu cầu

- Node.js >= 18
- PostgreSQL đang chạy (local hoặc Docker)

### Bước 1 — Cài dependencies

```bash
npm install
```

### Bước 2 — Cấu hình biến môi trường

```bash
cp .env.example .env
```

Mở file `.env` và điền thông tin thực tế:

```env
# Kết nối PostgreSQL (đổi username/password/tên DB cho đúng)
DATABASE_URL="postgresql://postgres:password@localhost:5432/expense_tracker_db?schema=public"

# Secret key cho JWT — đổi thành chuỗi random dài trong production
JWT_ACCESS_SECRET="bat-ky-chuoi-bi-mat-nao-cung-duoc"
JWT_ACCESS_EXPIRES_IN="15m"

JWT_REFRESH_SECRET="chuoi-bi-mat-khac-cho-refresh-token"
JWT_REFRESH_EXPIRES_IN="7d"

PORT=3000
```

### Bước 3 — Tạo database và chạy migration

```bash
# Tạo database + chạy migration (tạo các bảng)
npx prisma migrate dev --name init

# Sinh Prisma Client (cần chạy sau mỗi lần thay đổi schema)
npx prisma generate
```

### Bước 4 — Khởi động server

```bash
# Môi trường development (tự reload khi thay đổi code)
npm run start:dev
```

### Kiểm tra hoạt động

| URL | Mô tả |
|---|---|
| `http://localhost:3000/api/v1` | Base URL của API |
| `http://localhost:3000/api/docs` | Swagger UI — test API trực tiếp |

---

## 5. Hiểu NestJS từ gốc rễ

### 5.1 Luồng xử lý một request

Khi client gửi `POST /api/v1/wallets`, NestJS xử lý theo thứ tự:

```
Request đến
    ↓
Middleware (nếu có)
    ↓
Guard → JwtAuthGuard kiểm tra token có hợp lệ không
    ↓
Interceptor (trước) → ghi log, transform
    ↓
Pipe → ValidationPipe kiểm tra DTO
    ↓
Controller → walletsController.create()
    ↓
Service → walletsService.create() — business logic
    ↓
Prisma → query database
    ↓
Service trả về data
    ↓
Interceptor (sau) → ResponseInterceptor wrap data vào { success: true, data: ... }
    ↓
Response về client
```

### 5.2 Module — đơn vị tổ chức code

Mỗi module dùng decorator `@Module()` để khai báo:

```typescript
@Module({
  imports: [...],      // Các module khác cần dùng
  controllers: [...],  // Nhận và xử lý HTTP request
  providers: [...],    // Services, Guards, Strategies... (Dependency Injection)
  exports: [...],      // Những gì module này chia sẻ ra ngoài
})
export class WalletsModule {}
```

**Ví dụ thực tế trong project:**

```typescript
// src/app.module.ts — Module gốc, import tất cả
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Biến môi trường
    PrismaModule,       // Kết nối DB (global)
    AuthModule,
    WalletsModule,
    // ...
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // Global guard
  ],
})
export class AppModule {}
```

### 5.3 Dependency Injection (DI)

DI là cơ chế NestJS tự động tạo và cung cấp các dependency cho class, bạn không cần `new` thủ công.

```typescript
// CÁCH CŨ (không dùng DI) — phải tự tạo instance
const prisma = new PrismaService();
const service = new WalletsService(prisma);

// CÁCH NESTJS (DI) — khai báo trong constructor, NestJS lo phần còn lại
@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {
    // NestJS tự inject PrismaService vào đây
  }
}
```

**Quy tắc:** Để một class có thể được inject, nó phải có decorator `@Injectable()`.

### 5.4 Controller — nhận request, trả response

Controller chỉ làm 2 việc: nhận dữ liệu từ request và gọi service tương ứng.

```typescript
@Controller('wallets')              // Route prefix: /wallets
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Post()                           // POST /wallets
  create(
    @CurrentUser() user: JwtPayload,  // Lấy user từ JWT token
    @Body() dto: CreateWalletDto,     // Lấy body từ request (đã validate)
  ) {
    // Không có logic ở đây — chỉ gọi service
    return this.walletsService.create(user.sub, dto);
  }

  @Get(':id')                       // GET /wallets/:id
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string, // Parse và validate UUID
  ) {
    return this.walletsService.findOne(user.sub, id);
  }
}
```

### 5.5 Service — business logic

Service chứa toàn bộ business logic và tương tác với database.

```typescript
@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWalletDto) {
    return this.prisma.wallet.create({
      data: { name: dto.name, balance: dto.balance ?? 0, userId },
    });
  }

  async findOne(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) throw new NotFoundException('Ví không tồn tại');

    // Authorization: chỉ owner mới được xem ví của mình
    if (wallet.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập ví này');
    }

    return wallet;
  }
}
```

---

## 6. Database với Prisma ORM

### 6.1 Prisma là gì?

Prisma là một ORM (Object-Relational Mapper) hiện đại. Thay vì viết SQL thủ công, bạn dùng TypeScript để query database — an toàn về kiểu dữ liệu và không cần nhớ cú pháp SQL.

### 6.2 Schema — trái tim của Prisma

File `prisma/schema.prisma` định nghĩa toàn bộ cấu trúc database:

```prisma
model Wallet {
  id        String   @id @default(uuid())  // Khóa chính, tự sinh UUID
  name      String
  balance   Decimal  @default(0) @db.Decimal(15, 2)
  userId    String   @map("user_id")       // Tên cột trong DB là "user_id"
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at") // Tự cập nhật khi update

  // Quan hệ: một ví thuộc về một user
  user         User          @relation(fields: [userId], references: [id])
  // Quan hệ: một ví có nhiều transactions
  transactions Transaction[]

  @@map("wallets") // Tên bảng trong DB là "wallets"
}
```

### 6.3 Các lệnh Prisma cần nhớ

```bash
# Tạo migration mới khi thay đổi schema
npx prisma migrate dev --name ten_migration

# Xem và chỉnh sửa dữ liệu qua giao diện web
npx prisma studio

# Reset toàn bộ DB (xóa data, chạy lại migration)
npx prisma migrate reset

# Cập nhật Prisma Client sau khi sửa schema
npx prisma generate
```

### 6.4 Prisma Transaction — đảm bảo tính toàn vẹn dữ liệu

Khi tạo giao dịch, chúng ta cần làm 2 việc **cùng lúc**: tạo transaction record VÀ cập nhật balance ví. Nếu một bước lỗi, cả hai phải rollback.

```typescript
// src/transactions/transactions.service.ts
async create(userId: string, dto: CreateTransactionDto) {
  const balanceDelta =
    dto.type === TransactionType.INCOME
      ? Number(dto.amount)   // Thu nhập → cộng vào ví
      : -Number(dto.amount); // Chi tiêu → trừ khỏi ví

  // $transaction đảm bảo ATOMIC: cả 2 thành công hoặc cả 2 rollback
  const [transaction] = await this.prisma.$transaction([
    // Bước 1: Tạo transaction record
    this.prisma.transaction.create({ data: { ...dto, userId } }),
    // Bước 2: Cập nhật balance ví
    this.prisma.wallet.update({
      where: { id: dto.walletId },
      data: { balance: { increment: balanceDelta } },
    }),
  ]);

  return transaction;
}
```

### 6.5 PrismaService — kết nối NestJS với Prisma

```typescript
// src/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect(); // Kết nối DB khi app khởi động
  }

  async onModuleDestroy() {
    await this.$disconnect(); // Ngắt kết nối khi app tắt (graceful shutdown)
  }
}
```

```typescript
// src/prisma/prisma.module.ts
@Global() // ← Quan trọng! Cho phép inject PrismaService ở mọi module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## 7. Authentication — JWT + Refresh Token

### 7.1 Tại sao cần 2 loại token?

| | Access Token | Refresh Token |
|---|---|---|
| **Thời hạn** | Ngắn (15 phút) | Dài (7 ngày) |
| **Lưu ở đâu** | Memory / localStorage | HttpOnly Cookie hoặc DB |
| **Mục đích** | Xác thực mỗi request | Lấy access token mới |
| **Bảo mật** | Nếu bị lộ, thiệt hại giới hạn 15 phút | Hash trước khi lưu DB |

**Luồng hoạt động:**

```
1. Client đăng nhập → Server trả về accessToken (15p) + refreshToken (7d)
2. Client dùng accessToken để gọi API
3. AccessToken hết hạn → Client dùng refreshToken gọi POST /auth/refresh
4. Server xác nhận refreshToken hợp lệ → cấp cặp token mới (Rotation)
5. Đăng xuất → Server xóa refreshToken khỏi DB
```

### 7.2 Tại sao hash Refresh Token trước khi lưu DB?

Nếu database bị tấn công và lộ dữ liệu, kẻ tấn công không thể dùng token hash để đăng nhập — vì họ cần token gốc.

```typescript
// Khi tạo token: hash rồi mới lưu
const tokenHash = await bcrypt.hash(refreshToken, 10);
await prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } });

// Khi verify: so sánh token gốc với hash trong DB
for (const stored of storedTokens) {
  const isMatch = await bcrypt.compare(refreshToken, stored.tokenHash);
  if (isMatch) { /* hợp lệ */ }
}
```

### 7.3 JWT Strategy — cơ chế hoạt động

Passport.js là middleware xác thực phổ biến cho Node.js. NestJS tích hợp sẵn.

```typescript
// src/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Lấy token từ header
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),      // Dùng để verify chữ ký
    });
  }

  // Được gọi SAU KHI JWT verify thành công
  // Kết quả trả về sẽ được gắn vào request.user
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Tài khoản không tồn tại');
    return payload; // → request.user = payload
  }
}
```

### 7.4 Global Guard + @Public() decorator

Đăng ký `JwtAuthGuard` như global guard trong `app.module.ts` → **tất cả route đều yêu cầu JWT**. Route nào không cần auth thì thêm `@Public()`.

```typescript
// Cách 1: Route yêu cầu auth (mặc định, không cần làm gì)
@Get('wallets')
findAll(@CurrentUser() user: JwtPayload) { ... }

// Cách 2: Route công khai, không cần auth
@Public()
@Post('auth/login')
login(@Body() dto: LoginDto) { ... }
```

**Cơ chế `@Public()` hoạt động như thế nào?**

```typescript
// Bước 1: Tạo metadata key
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true); // Gắn metadata vào route

// Bước 2: Guard đọc metadata và bỏ qua auth
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }

  canActivate(context: ExecutionContext) {
    // Đọc metadata từ route handler
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Đọc từ method
      context.getClass(),   // Đọc từ class
    ]);

    if (isPublic) return true; // Bỏ qua JWT validation
    return super.canActivate(context); // Validate JWT bình thường
  }
}
```

### 7.5 @CurrentUser() decorator

Decorator tùy chỉnh giúp controller lấy thông tin user từ `request.user` một cách gọn gàng.

```typescript
// Định nghĩa
export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return field ? user?.[field] : user; // Lấy field cụ thể hoặc toàn bộ
  },
);

// Sử dụng trong controller
@Get('profile')
getProfile(@CurrentUser() user: JwtPayload) {
  // user = { sub: "uuid...", email: "..." }
  return this.usersService.getProfile(user.sub);
}

// Hoặc lấy chỉ userId
@Get('profile')
getProfile(@CurrentUser('sub') userId: string) {
  return this.usersService.getProfile(userId);
}
```

---

## 8. Validation với DTO

### DTO là gì?

**DTO (Data Transfer Object)** là class TypeScript định nghĩa hình dạng dữ liệu mà API nhận vào. Kết hợp `class-validator` để validate tự động.

```typescript
// src/wallets/dto/create-wallet.dto.ts
export class CreateWalletDto {
  @ApiProperty({ example: 'Ví tiền mặt' }) // Hiển thị trong Swagger
  @IsString()
  @IsNotEmpty({ message: 'Tên ví không được để trống' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()         // Field này không bắt buộc
  @IsNumber()
  @Min(0)
  @Type(() => Number)   // Tự convert string "1000" → number 1000
  balance?: number;
}
```

### ValidationPipe — hoạt động tự động

```typescript
// src/main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,            // Bỏ field lạ không có trong DTO
    forbidNonWhitelisted: true, // Throw lỗi nếu client gửi field không hợp lệ
    transform: true,            // Tự chuyển đổi type
  }),
);
```

**Ví dụ:** Client gửi `{ "name": "", "hackerField": "xss" }`
- `whitelist: true` → bỏ `hackerField`
- `@IsNotEmpty()` → throw lỗi vì `name` rỗng
- Client nhận về: `{ "success": false, "message": ["Tên ví không được để trống"] }`

---

## 9. Guards, Interceptors, Filters

### 9.1 Guards — bảo vệ route

Guard quyết định request có được phép tiếp tục hay không (return `true`/`false`).

```
Guard chạy TRƯỚC khi vào controller.
Dùng cho: Authentication, Authorization, Rate limiting...
```

```typescript
// JwtAuthGuard: kiểm tra JWT token hợp lệ
// Đã giải thích ở mục 7.4
```

### 9.2 Interceptors — biến đổi request/response

Interceptor chạy **trước và sau** khi controller xử lý. Tương tự middleware nhưng có thêm khả năng biến đổi response.

```typescript
// src/common/interceptors/response.interceptor.ts
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      // Biến đổi mọi response thành công thành format chuẩn
      map((data) => ({ success: true, data })),
    );
  }
}

// Kết quả: controller return { id: "...", name: "Ví mặt" }
// Client nhận: { "success": true, "data": { "id": "...", "name": "Ví mặt" } }
```

### 9.3 Exception Filters — xử lý lỗi tập trung

Filter bắt exception và chuyển thành response lỗi có format chuẩn.

```typescript
// src/common/filters/http-exception.filter.ts
@Catch(HttpException) // Bắt tất cả HttpException
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const status = exception.getStatus();
    const message = exception.getResponse();

    response.status(status).json({
      success: false,
      statusCode: status,
      message: [...], // Mảng message để nhất quán
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

// Kết quả: khi throw new NotFoundException('Ví không tồn tại')
// Client nhận: { "success": false, "statusCode": 404, "message": ["Ví không tồn tại"] }
```

### 9.4 So sánh nhanh

| | Guard | Interceptor | Filter |
|---|---|---|---|
| **Thời điểm** | Trước controller | Trước + sau controller | Khi có exception |
| **Dùng cho** | Auth, Phân quyền | Transform request/response | Xử lý lỗi |
| **Decorator** | `@UseGuards()` | `@UseInterceptors()` | `@UseFilters()` |

---

## 10. Danh sách API Endpoints

> Tất cả routes (trừ Auth) yêu cầu header: `Authorization: Bearer <accessToken>`

### Auth

| Method | Endpoint | Mô tả | Auth? |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Đăng ký tài khoản | Không |
| POST | `/api/v1/auth/login` | Đăng nhập | Không |
| POST | `/api/v1/auth/refresh` | Làm mới access token | Không |
| POST | `/api/v1/auth/logout` | Đăng xuất | Có |
| GET | `/api/v1/auth/me` | Xem thông tin từ token | Có |

### Users

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/users/profile` | Xem profile |
| PATCH | `/api/v1/users/profile` | Cập nhật tên / mật khẩu |

### Wallets

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/wallets` | Tạo ví mới |
| GET | `/api/v1/wallets` | Lấy tất cả ví |
| GET | `/api/v1/wallets/:id` | Chi tiết ví |
| PATCH | `/api/v1/wallets/:id` | Cập nhật ví |
| DELETE | `/api/v1/wallets/:id` | Xóa ví |

### Categories

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/categories` | Tạo danh mục |
| GET | `/api/v1/categories?type=EXPENSE` | Lấy danh mục (filter tuỳ chọn) |
| GET | `/api/v1/categories/:id` | Chi tiết danh mục |
| PATCH | `/api/v1/categories/:id` | Cập nhật danh mục |
| DELETE | `/api/v1/categories/:id` | Xóa danh mục |

### Transactions

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/transactions` | Tạo giao dịch (cập nhật balance tự động) |
| GET | `/api/v1/transactions?type=EXPENSE&page=1&limit=20` | Lấy giao dịch (filter + phân trang) |
| GET | `/api/v1/transactions/:id` | Chi tiết giao dịch |
| PATCH | `/api/v1/transactions/:id` | Cập nhật giao dịch |
| DELETE | `/api/v1/transactions/:id` | Xóa giao dịch (hoàn balance) |

### Reports

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/reports/monthly?year=2024&month=1` | Báo cáo tháng |
| GET | `/api/v1/reports/wallets-overview` | Tổng quan số dư ví |
| GET | `/api/v1/reports/trend` | Xu hướng 6 tháng gần nhất |

---

## 11. Luồng dữ liệu tổng thể

### Ví dụ: Tạo giao dịch chi tiêu

```
Client → POST /api/v1/transactions
Body: {
  "amount": 50000,
  "type": "EXPENSE",
  "note": "Ăn phở",
  "transactionDate": "2024-01-15T08:00:00Z",
  "walletId": "uuid-vi-tien-mat",
  "categoryId": "uuid-an-uong"
}
Authorization: Bearer eyJhbGci...
```

**Bước 1 — JwtAuthGuard:**
- Extract token từ header
- Verify chữ ký JWT bằng `JWT_ACCESS_SECRET`
- Gọi `JwtStrategy.validate()` → kiểm tra user tồn tại
- Gắn `{ sub: "user-uuid", email: "..." }` vào `request.user`

**Bước 2 — ValidationPipe:**
- Parse body thành `CreateTransactionDto`
- Kiểm tra: `amount > 0`, `type` là enum hợp lệ, `walletId` là UUID...
- Nếu sai → throw `BadRequestException` → Filter format lỗi → trả 400

**Bước 3 — Controller:**
```typescript
create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTransactionDto) {
  return this.transactionsService.create(user.sub, dto);
}
```

**Bước 4 — Service:**
1. Kiểm tra wallet tồn tại và thuộc về user
2. Kiểm tra category tồn tại và thuộc về user
3. Kiểm tra `category.type === dto.type` (không dùng danh mục "Lương" cho giao dịch EXPENSE)
4. Tính `balanceDelta = -50000` (EXPENSE → trừ tiền)
5. Chạy `prisma.$transaction([createTransaction, updateWalletBalance])`

**Bước 5 — ResponseInterceptor:**
```json
{
  "success": true,
  "data": {
    "id": "new-transaction-uuid",
    "amount": "50000",
    "type": "EXPENSE",
    "note": "Ăn phở",
    "wallet": { "id": "...", "name": "Ví tiền mặt" },
    "category": { "id": "...", "name": "Ăn uống" }
  }
}
```

---

## 12. Câu hỏi thường gặp khi học

**Q: Tại sao dùng `@Global()` cho PrismaModule?**

> Nếu không có `@Global()`, mỗi module muốn dùng `PrismaService` phải import `PrismaModule`. Vì hầu như module nào cũng cần DB, dùng `@Global()` giúp tránh lặp code. Tuy nhiên, không nên lạm dụng `@Global()` cho những module thông thường.

**Q: Tại sao `JwtModule.register({})` không có secret?**

> Vì project này dùng **2 secret khác nhau**: một cho access token, một cho refresh token. Nếu khai báo secret trong `JwtModule`, chỉ set được 1 secret. Thay vào đó, chúng ta override secret mỗi khi gọi `jwtService.signAsync(payload, { secret: ... })`.

**Q: `ParseUUIDPipe` trong `@Param('id', ParseUUIDPipe)` dùng để làm gì?**

> Tự động validate `id` từ URL phải là UUID hợp lệ. Nếu client gửi `/wallets/abc`, NestJS throw `BadRequestException` ngay tại tầng controller, không cần kiểm tra trong service.

**Q: Tại sao cần check `wallet.userId !== userId` trong service thay vì query thẳng `{ id, userId }`?**

> Cả 2 cách đều đúng. Cách trong project tách biệt 2 lỗi: nếu wallet không tồn tại → 404 Not Found; nếu tồn tại nhưng không phải của user → 403 Forbidden. Điều này giúp client hiểu chính xác lỗi gì xảy ra.

**Q: Swagger tự sinh tài liệu như thế nào?**

> Các decorator `@ApiProperty()`, `@ApiOperation()`, `@ApiTags()` gắn metadata vào class và method. Khi app khởi động, `SwaggerModule.createDocument()` đọc toàn bộ metadata đó và sinh ra file OpenAPI JSON, rồi render thành giao diện tại `/api/docs`.

**Q: `Promise.all()` trong service dùng để làm gì?**

> Chạy nhiều query song song thay vì tuần tự. Ví dụ trong `findAll()`, thay vì chạy `count` rồi mới chạy `findMany` (tổng 2 roundtrip DB), `Promise.all` chạy cả 2 cùng lúc → nhanh hơn gần 2 lần.
