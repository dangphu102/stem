# Đưa Mầm Lab lên Internet

## GitHub Pages (đã cấu hình tự động)

Repository đã có workflow GitHub Actions để build và publish website khi có push lên nhánh `main`:

- Build command: `npm run build`
- URL dự kiến: https://dangphu102.github.io/stem/
- Workflow: `.github/workflows/deploy-pages.yml`

Nếu GitHub Pages chưa được bật, vào repository → Settings → Pages và chọn **GitHub Actions** tại mục Build and deployment. Sau đó vào tab Actions, chờ workflow **Deploy Mầm Lab to GitHub Pages** chạy xong. Những lần cập nhật tiếp theo sẽ tự deploy sau mỗi lần push lên `main`.

## Phương án nhanh: Netlify Drop

Website hiện là ứng dụng tĩnh Vite/React, không cần máy chủ backend để chạy bản demo.

1. Mở Terminal trong thư mục dự án và chạy `npm run build`.
2. Sau khi build thành công, mở thư mục dự án và kéo thả **cả thư mục `dist`** vào Netlify Drop: https://app.netlify.com/drop
3. Đăng nhập/tạo tài khoản Netlify nếu dịch vụ yêu cầu.
4. Netlify tạo một URL dạng `https://ten-ngau-nhien.netlify.app`; gửi URL này cho người muốn xem.
5. Có thể đổi tên website trong Site configuration → Change site name.

Mỗi lần cập nhật ứng dụng, chạy lại `npm run build` và tải thư mục `dist` mới lên Netlify.

## Deploy tự động khi có GitHub

Dự án đã có `netlify.toml` với cấu hình build `npm run build` và thư mục publish `dist`.

1. Đưa mã nguồn lên một GitHub repository.
2. Trong Netlify chọn Add new site → Import an existing project.
3. Kết nối GitHub và chọn repository của Mầm Lab.
4. Xác nhận build command `npm run build`, publish directory `dist`, sau đó chọn Deploy.
5. Từ lần sau, mỗi lần push code lên nhánh production, Netlify tự build và cập nhật website.

## Lưu ý về dữ liệu học tập

Tiến độ bài học và lịch sử kiểm tra hiện lưu trong `localStorage` của trình duyệt. Người dùng xem website từ thiết bị/trình duyệt khác sẽ có dữ liệu riêng; dữ liệu chưa được đồng bộ giữa nhiều người. Muốn có tài khoản dùng chung và lưu kết quả tập trung thì cần bổ sung backend/cơ sở dữ liệu.
