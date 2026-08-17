-- Bỏ cột user_role trên bảng users.
-- Lý do: role của user được xác định qua quan hệ User.role (Role[] many-to-many,
-- bảng nối _UserRoles), không phải qua cột phẳng này. Cột từng được ghi khi
-- register() nhưng chưa từng được đọc lại đúng cách cho việc cấp quyền, gây bug
-- (JWT userRole luôn là "USER" bất kể role thật qua relation).
ALTER TABLE "users" DROP COLUMN "user_role";
