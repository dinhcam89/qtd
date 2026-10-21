---
description: Làm task tiếp theo trong docs/ROADMAP.md, kiểm thử hồi quy, ghi tiến độ vào docs/PROGRESS.md
---

Đọc AGENTS.md (đặc biệt mục 4.1 về môi trường) và docs/ROADMAP.md các mục 0, 1, 2, 3. Chỉ đọc thêm đúng mục của task bạn sẽ làm.

## THAM SỐ (đọc từ tin nhắn của người dùng đi kèm lệnh này)
- Số task tối đa (mặc định 1)
- Cổng người dùng đã xong (mặc định: chưa có)
- Quyết định CMS: A hoặc B (mặc định A, nghĩa là bỏ qua Task 12-13)
- Ghi chú đặc biệt: nếu có, thực hiện TRƯỚC task chính, mỗi ghi chú là một mục việc nhỏ có commit riêng

## BƯỚC A. XÁC ĐỊNH VỊ TRÍ VÀ KIỂM TRA HỒI QUY
1. Nếu docs/ROADMAP.md không tồn tại: DỪNG, báo người dùng thêm file.
2. Đọc docs/PROGRESS.md. Nếu chưa có thì tạo từ bảng ở mục 0 của ROADMAP.md (Task 1-2 "Xong", còn lại "Chưa làm"). Với Task 3: kiểm tra TỪNG tiêu chí hoàn thành của Task 3 trong ROADMAP.md bằng lệnh rồi đánh dấu "Xong" hoặc "Chưa xong". Không đánh dấu Xong dựa trên báo cáo cũ.
3. Chạy: git status --short, git log --oneline -10, git ls-files --eol.
   Nếu working tree không sạch hoặc có crlf: DỪNG và báo, không làm tiếp.
4. Chạy toàn bộ kiểm tra hiện có: npm run lint, check, build, test (nếu đã có), check:dist (nếu đã có). Dán OUTPUT THẬT, không tóm tắt.
   Có lệnh fail: sửa lỗi nền trước, commit riêng với tiền tố "fix:", ghi vào PROGRESS.md. Chưa sửa xong thì không làm task mới.
5. Chọn task có số nhỏ nhất đang "Chưa làm" (hoặc "Chưa xong"). Bỏ qua Task 12-13 nếu quyết định CMS là A.
6. Kiểm tra cổng: nếu task cần một cổng chưa nằm trong "Cổng người dùng đã xong" thì DỪNG và in checklist việc người dùng cần làm. Quy ước: G2 bắt buộc trước Task 7, G3 bắt buộc trước Task 16, G5 bắt buộc trước Task 17. G1 nên xong trước Task 6 nhưng không bắt buộc.

## BƯỚC B. LÀM TASK
7. Làm đúng mục task trong ROADMAP.md và Giao thức chung (mục 1). Task ghi "Cần duyệt plan": đưa plan rồi DỪNG chờ người dùng.
8. Phần "Người dùng làm tay" (G1) và Task 17 (go-live): KHÔNG tự làm. Chỉ chuẩn bị file kỹ thuật nếu có và in checklist.
9. Kiểm thử bắt buộc:
   - Chạy mọi tiêu chí hoàn thành của task bằng lệnh, dán output thật.
   - Tiêu chí "cố ý thêm thử ... phải fail": thực hiện thật, dán bằng chứng fail, rồi HOÀN TÁC (git diff phải sạch phần thử nghiệm).
   - Chạy lại toàn bộ kiểm tra của bước A.4 sau khi làm xong để chắc không phá task trước.
   - Kiểm tra bằng trình duyệt đúng một lần ở cuối task (chỉ khi có thay đổi giao diện), 360/768/1280/1920px, tối đa 3 vòng sửa.
   - Nếu công cụ trình duyệt của IDE lỗi: KHÔNG được khẳng định đã kiểm tra giao diện. Ghi rõ "chưa kiểm tra bằng trình duyệt" và dựa vào Playwright khi đã có.
10. Chạy /qa rồi /review trên diff của task. Sửa mọi mục "Chặn merge".
11. Cập nhật docs/PROGRESS.md: trạng thái task, ngày, commit hash, kết quả từng tiêu chí (Đạt/Không đạt), số placeholder còn lại, việc người dùng cần làm. Commit local (Conventional Commits). KHÔNG push.

## BƯỚC C. DỪNG HAY TIẾP
12. Chỉ sang task kế tiếp trong cùng cuộc hội thoại nếu: số task tối đa chưa đạt, task vừa xong đều Đạt, không có cổng người dùng giữa hai task, và bạn chưa dùng quá khoảng 25 lệnh trong cuộc này.
13. Kết thúc bằng "BÁO CÁO CHẶNG" ngắn: task đã làm, bảng Đạt/Không đạt, output lệnh quan trọng, gói đã thêm, placeholder còn lại, việc người dùng cần làm. Dòng cuối: "Chạy lại /next-task (cập nhật tham số) để tiếp tục."

## LUẬT CỨNG
- Không bịa số liệu, tên người, lãi suất, địa chỉ, văn bản pháp lý. Thiếu thì ghi [CẦN BỔ SUNG].
- Không dùng `overflow-x: hidden` trên html/body để che lỗi tràn ngang. Phải sửa phần tử gây tràn. Cuộn ngang chỉ được đặt ở container cụ thể (ví dụ bảng).
- Chỉ cài gói trong bảng "Gói đã duyệt trước" của đúng task. Gói khác: dừng và hỏi.
- Ghi file bằng công cụ ghi file của IDE. Lỗi 2 lần thì dừng và báo.
- Không đọc node_modules trừ khi bắt buộc. Khám phá tối đa 15 lệnh.
- Không push, không merge, không đụng secret.
- Tình huống thuộc "Dừng và hỏi" ở ROADMAP.md mục 1: dừng và hỏi, không tự quyết.
- Báo cáo chỉ được ghi 'hoàn thành' khi đã chạy npm run verify (log đầy đủ ở reports/verify-latest.log) và đã chạy /qa và /review. Thiếu một trong ba thì dòng đầu báo cáo phải là 'CHƯA HOÀN THÀNH: thiếu ...' và làm nốt ngay trong cùng phiên.
