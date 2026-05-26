// Định nghĩa kiểu dữ liệu của JWT payload
// Đây là data chúng ta encode vào JWT token khi sign
export interface JwtPayload {
  sub: string;   // subject - thường là user ID (convention của JWT)
  email: string;
  iat?: number;  // issued at - tự động thêm bởi JWT
  exp?: number;  // expiration time - tự động thêm bởi JWT
}
