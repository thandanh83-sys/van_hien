/* =====================================================================
   VĂN ĐẠO ENGINE - ĐẠI BÁCH KHOA TOÀN THƯ (18 QUYỂN)
   Tác giả: Văn Đạo
   Mô tả: Hợp nhất 8 quyển nền tảng, 9 quyển mở rộng và hệ thống quản trị.
   ===================================================================== */
const ENCYCLOPEDIA_DATA = [
    // ================================================================
    // QUYỂN 0: TÂM THƯ
    // ================================================================
    {
        title: "Quyển 0. Tâm Thư – Tuyên Ngôn Nền Tảng",
        content: `
            <h4>0.1. Tuyên ngôn học tập và sáng tạo</h4>
            <p>"Học rộng để có nhiều chân trời, học sâu để thấu bản chất, cảm thụ tinh tế để nhận ra vẻ đẹp, sáng tạo độc lập để hình thành phong cách."</p>
            <p>"Điều đáng quý nhất ở một thi nhân không phải là họ nhìn thấy bao nhiêu điều trong một ánh trăng, mà là họ có thể khiến người đọc nhìn thấy một ánh trăng chưa từng được cảm nhận theo cách ấy."</p>
            <p>"Tri thức giúp câu thơ có chiều sâu; cảm xúc giúp câu thơ có linh hồn; sự tiết chế giúp câu thơ sống lâu trong lòng người đọc. Đừng biến kho điển tích thành nơi phô diễn kiến thức. Một ánh trăng đúng chỗ đôi khi có sức gợi hơn mười điển cố được đặt cạnh nhau."</p>
            <p>"Nho gia là đạo lý để bước vào đời; Đạo gia là một tâm thế để đi qua đời."</p>
            <h4>0.2. Quan niệm về người sáng tác</h4>
            <p>Người làm thơ không chỉ là người có cảm xúc mà còn là người có năng lực quan sát, suy tưởng, liên tưởng, thẩm mỹ và chuyển hóa tri thức thành nghệ thuật. Năm năng lực cốt lõi:</p>
            <ol>
                <li><b>Quan sát:</b> Nhìn thấy chi tiết, sắc thái mà người khác dễ bỏ qua.</li>
                <li><b>Cảm thụ:</b> Nhận biết vẻ đẹp, nỗi buồn, sự tinh tế của con người, thiên nhiên.</li>
                <li><b>Tri thức:</b> Hiểu biết về lịch sử, văn học, triết học, tôn giáo, mỹ học.</li>
                <li><b>Liên tưởng:</b> Kết nối những sự vật, hình tượng, hệ tư tưởng tưởng như xa cách.</li>
                <li><b>Sáng tạo:</b> Biến những gì đã học, đã cảm nhận thành thế giới nghệ thuật có dấu ấn riêng.</li>
            </ol>
            <h4>0.3. Nguyên lý sáng tạo</h4>
            <ul>
                <li>Học rộng để mở rộng biên độ sáng tạo. Học sâu để làm chủ tri thức.</li>
                <li>Đọc nhiều để hình thành khả năng đối chiếu. Cảm nhận tinh tế để nhận ra vẻ đẹp.</li>
                <li>Chọn lọc để tránh sự rườm rà. Sáng tạo độc lập để hình thành phong cách.</li>
                <li><b>Nguyên lý cốt lõi:</b> Tri thức là phương tiện mở rộng khả năng sáng tạo, không phải vật trang sức cho câu thơ. Cảm xúc là nguồn năng lượng của tác phẩm, còn kỹ thuật nghệ thuật là phương tiện giúp cảm xúc đạt đến hình thức biểu đạt tinh tế.</li>
            </ul>
        `
    },
    // ================================================================
    // QUYỂN I: SÁU NGUYÊN TẮC HỌC THUẬT CỐT LÕI
    // ================================================================
    {
        title: "Quyển I. Sáu Nguyên Tắc Học Thuật Cốt Lõi",
        content: `
            <h4>1.1. Phân định văn tự và bối cảnh văn học</h4>
            <p>Không đồng nhất những tác phẩm có hình thức gần nhau nhưng thuộc những truyền thống văn học khác nhau. Cần phân biệt: Văn học chữ Hán của Việt Nam, Văn học chữ Nôm của Việt Nam, Văn học chữ Hán của Trung Hoa, Thơ Đường Trung Hoa, Thơ Nôm Đường luật Việt Nam.</p>
            <h4>1.2. Phân biệt thể loại, thể thơ và luật thơ</h4>
            <ul>
                <li><b>Thể loại:</b> Phương thức tổ chức tác phẩm theo đặc điểm nội dung và hình thức lớn (Tự sự, Trữ tình, Kịch, Văn chính luận).</li>
                <li><b>Thể thơ:</b> Hình thức tổ chức dòng thơ và số tiếng, số câu (Lục bát, Song thất lục bát, Ngũ ngôn, Thất ngôn, Thơ tự do).</li>
                <li><b>Luật thơ:</b> Hệ thống quy tắc về thanh điệu, vần, niêm, đối (Luật bằng - trắc, phép đối Đường luật).</li>
                <li>Tuyệt đối không dùng ba khái niệm này thay thế cho nhau.</li>
            </ul>
            <h4>1.3. Thận trọng khi sử dụng khái niệm phá cách</h4>
            <p>Một tác phẩm không tuân thủ quy tắc truyền thống chưa đương nhiên là phá cách có chủ ý. Cần xem xét: Quy tắc vận dụng -> Mức độ sai lệch -> Tính nhất quán -> Hiệu quả biểu đạt -> Bằng chứng cấu trúc. Nếu chưa đủ căn cứ, nên dùng: hình thức biến thể, cách tổ chức phóng khoáng.</p>
            <h4>1.4. Tiết chế điển tích và điển cố</h4>
            <p>Điển tích là chất liệu văn hóa có khả năng mở rộng chiều sâu. Khi sử dụng cần kiểm tra: Nguồn gốc -> Văn bản -> Ý nghĩa nguyên thủy -> Biến đổi nghĩa -> Sự phù hợp. Một điển tích có giá trị khi tạo thêm chiều sâu cho hình tượng, không chỉ chứng minh người viết có nhiều kiến thức.</p>
            <h4>1.5. Tôn trọng tính đa nghĩa của biểu tượng</h4>
            <p>Biểu tượng nghệ thuật không phải công thức giải mã cố định. Ánh trăng có thể gợi: Nỗi nhớ quê, Tình cảm tri âm, Sự đoàn viên, Cô đơn, Vẻ đẹp thanh tao, Thời gian, Tâm thức thiền định. Ý nghĩa phải được xác định từ văn cảnh, chủ thể trữ tình và cấu trúc tác phẩm.</p>
            <h4>1.6. Phân biệt sự thật, giả thuyết và diễn giải</h4>
            <p>Phân thành bốn cấp: Dữ kiện (có căn cứ văn bản/lịch sử) -> Giả thuyết (có khả năng đúng nhưng cần chứng cứ) -> Diễn giải (cách đọc dựa trên lập luận) -> Cảm nhận (phản ứng thẩm mỹ). Không trình bày một liên tưởng cá nhân như một sự thật lịch sử.</p>
        `
    },
    // ================================================================
    // QUYỂN II: THI PHÁP HỌC & MỸ HỌC
    // ================================================================
    {
        title: "Quyển II. Thi Pháp Học Và Mỹ Học",
        content: `
            <h4>2.1. Khái niệm thi pháp học</h4>
            <p>Nghiên cứu nguyên tắc, phương thức tổ chức nghệ thuật của tác phẩm văn học: cách tác phẩm được tổ chức, hình tượng xây dựng ra sao, thời gian/không gian vận động thế nào, ngôn ngữ tạo hiệu quả gì và các yếu tố kết hợp thành chỉnh thể như thế nào.</p>
            <h4>2.2. Hệ thống bốn tầng phân tích</h4>
            <p><b>Tầng 1. Tính nhạc – Vẻ đẹp âm thanh</b></p>
            <ul>
                <li><b>Thanh điệu:</b> Bằng (ngang, huyền) và Trắc (sắc, hỏi, ngã, nặng).</li>
                <li><b>Vần:</b> Vần chân, vần lưng, vần liền, vần cách, vần ôm.</li>
                <li><b>Nhịp:</b> Cách tổ chức điểm ngắt (2/2/2, 3/3, 4/4...).</li>
                <li><b>Phối âm:</b> Lựa chọn nguyên âm, phụ âm, âm mở, âm khép.</li>
            </ul>
            <p><b>Tầng 2. Điệu thơ – Nhịp vận động cảm xúc</b></p>
            <ul>
                <li><b>Sắc điệu:</b> Trang trọng, Trữ tình, U hoài, Bi tráng, Hào sảng, Thanh thoát, Châm biếm, Thiền vị.</li>
            </ul>
            <p><b>Tầng 3. Thần thái – Khí chất nghệ thuật</b></p>
            <ul>
                <li><b>Các phẩm chất:</b> Cổ phong, Thanh tân, Thanh nhã, Hào sảng, Bi tráng, U nhã, Phóng khoáng, Dân gian.</li>
            </ul>
            <p><b>Tầng 4. Hồn thơ – Sức sống tinh thần</b></p>
            <ul>
                <li>Hòa quyện 5 thành tố: Tình (cảm xúc), Ý (tư tưởng), Cảnh (hình tượng), Điệu (nhịp vận động), Thần (khí chất).</li>
            </ul>
            <h4>2.3. Các cặp phạm trù thi pháp</h4>
            <ul>
                <li><b>Tĩnh và Động:</b> Dĩ động tả tĩnh.</li>
                <li><b>Không gian nghệ thuật:</b> Không gian thực, tâm tưởng, làng quê, đô thị...</li>
                <li><b>Thời gian nghệ thuật:</b> Tuyến tính, tuần hoàn, đồng hiện, hồi tưởng...</li>
                <li><b>Tả cảnh ngụ tình:</b> Cảnh vật biểu đạt tâm trạng.</li>
                <li><b>Hàm súc:</b> Ý tại ngôn ngoại.</li>
                <li><b>Thi trung hữu họa / Thi trung hữu nhạc.</b></li>
            </ul>
        `
    },
    // ================================================================
    // QUYỂN III: TAM GIÁO
    // ================================================================
    {
        title: "Quyển III. Chuyên Đề Tam Giáo – Nho, Đạo, Phật",
        content: `
            <h4>3.1. Nguyên tắc nghiên cứu</h4>
            <p>Không đóng khung Nho là nhập thế, Đạo là xuất thế, Phật là giải thoát như ba định nghĩa tuyệt đối. Ba truyền thống có quá trình giao thoa phức tạp.</p>
            <h4>3.2. Nho gia – Đạo lý để bước vào đời</h4>
            <ul>
                <li><b>Cốt lõi:</b> Ngũ thường (Nhân, Nghĩa, Lễ, Trí, Tín). Cách vật - Trí tri - Thành ý - Chính tâm - Tu thân - Tề gia - Trị quốc - Bình thiên hạ.</li>
                <li><b>Lưu ý:</b> Tam cương là hệ chuẩn mực lịch sử phong kiến, không phải đạo đức phổ quát.</li>
            </ul>
            <h4>3.3. Đạo gia – Tâm thế để đi qua đời</h4>
            <ul>
                <li><b>Phân định:</b> Đạo gia (Lão Trang: Đạo, Vô vi, Tự nhiên, Tiêu dao) khác Đạo giáo (tôn giáo có nghi lễ).</li>
                <li><b>Lưu ý:</b> "Thượng thiện nhược thủy". Không phải cứ viết về núi rừng là chịu ảnh hưởng Đạo gia.</li>
            </ul>
            <h4>3.4. Phật giáo – Chiêm nghiệm, từ bi và giải thoát</h4>
            <ul>
                <li><b>Cốt lõi:</b> Tứ diệu đế, Duyên khởi, Vô thường, Vô ngã, Nghiệp, Từ bi, Bát chính đạo.</li>
                <li><b>Lưu ý:</b> Không đồng nhất vô thường với bi quan, nghiệp với số phận định sẵn.</li>
            </ul>
            <h4>3.5. Sự giao thoa Tam giáo</h4>
            <p>Trong lịch sử văn học Việt Nam và Đông Á, Nho – Đạo – Phật nhiều lần cùng tồn tại, tiếp xúc và dung hợp. Cần phân biệt: Cùng tồn tại -> Ảnh hưởng qua lại -> Tiếp nhận có chọn lọc -> Dung thông tư tưởng.</p>
        `
    },
    // ================================================================
    // QUYỂN IV: VĂN HỌC SỬ & THỂ LOẠI
    // ================================================================
    {
        title: "Quyển IV. Văn Học Sử Và Phân Định Thể Loại",
        content: `
            <h4>4.1. Hệ thống thể loại văn học</h4>
            <ul>
                <li><b>Tự sự:</b> Truyện ngắn, Tiểu thuyết, Truyện thơ, Sử thi, Truyền thuyết, Cổ tích, Ngụ ngôn.</li>
                <li><b>Trữ tình:</b> Thơ trữ tình, Khúc ngâm, Thơ tự sự - trữ tình, Thơ triết lý, Thơ trào phúng.</li>
                <li><b>Kịch:</b> Bi kịch, Hài kịch, Chính kịch, Kịch thơ.</li>
                <li><b>Văn chính luận:</b> Cáo, Hịch, Chiếu, Biểu, Tấu, Sớ.</li>
            </ul>
            <h4>4.2. Hệ thống thể thơ</h4>
            <ul>
                <li><b>Lục bát:</b> Dòng 6 và 8 tiếng luân phiên.</li>
                <li><b>Song thất lục bát:</b> 2 dòng 7 tiếng, 1 dòng 6 tiếng, 1 dòng 8 tiếng.</li>
                <li><b>Thất ngôn tứ tuyệt / bát cú:</b> 4 câu / 8 câu, mỗi câu 7 tiếng.</li>
                <li><b>Ngũ ngôn:</b> Mỗi dòng 5 tiếng.</li>
                <li><b>Thơ tự do:</b> Không giới hạn số tiếng/câu cố định nhưng vẫn cần cấu trúc và nhạc tính.</li>
            </ul>
            <h4>4.3. Phân định các tác phẩm tiêu biểu</h4>
            <ul>
                <li><b>Nam quốc sơn hà:</b> Thơ chữ Hán.</li>
                <li><b>Bình Ngô đại cáo:</b> Văn chính luận, thể cáo, chữ Hán.</li>
                <li><b>Truyện Kiều:</b> Truyện thơ Nôm, lục bát.</li>
                <li><b>Chinh phụ ngâm:</b> Ngâm khúc, bản diễn Nôm dùng song thất lục bát.</li>
                <li><b>Tây Tiến:</b> Thơ kháng chiến chống Pháp (Không xếp vào Thơ Mới).</li>
            </ul>
        `
    },
    // ================================================================
    // QUYỂN V: TỪ ĐIỂN BIỂU TƯỢNG
    // ================================================================
    {
        title: "Quyển V. Từ Điển Biểu Tượng Và Ngôn Ngữ Nghệ Thuật",
        content: `
            <h4>5.1. Biểu tượng trong văn học</h4>
            <p>Hình ảnh mang ý nghĩa vượt ra ngoài sự vật trực tiếp. Một biểu tượng có thể có: Nghĩa tả thực, nghĩa văn hóa, lịch sử, tâm lý, triết học và nghĩa riêng trong tác phẩm.</p>
            <h4>5.2. Hệ thống biểu tượng Á Đông</h4>
            <ul>
                <li><b>Tứ quý:</b> Tùng (bền bỉ), Cúc (thanh cao), Trúc (ngay thẳng), Mai (sức sống).</li>
                <li><b>Khác:</b> Trăng (đoàn viên, nhớ, cô đơn), Liễu (chia biệt), Đào (tuổi trẻ), Sen (thanh khiết), Hạc (thanh cao), Nhạn (tin tức), Mây (phiêu du), Nước (thời gian).</li>
            </ul>
            <h4>5.3. Từ điển Hán Việt trong thi ca</h4>
            <p><em>Đã tách thành Quyển VIII. Mời bạn đọc tiếp ở dưới.</em></p>
            <h4>5.4. Các biện pháp tu từ</h4>
            <p>Ẩn dụ, Hoán dụ, Nhân hóa, Điệp ngữ, Đảo ngữ, Đối, Nói quá/nói giảm, Tượng trưng.</p>
            <h4>5.5. Phương pháp giải mã biểu tượng (5 câu hỏi)</h4>
            <ol>
                <li>Nghĩa tả thực là gì?</li>
                <li>Lịch sử biểu tượng trong văn hóa?</li>
                <li>Bối cảnh xuất hiện?</li>
                <li>Liên hệ với cảm xúc chủ thể?</li>
                <li>Ý nghĩa riêng tác phẩm tạo ra?</li>
            </ol>
        `
    },
    // ================================================================
    // QUYỂN VI: THỰC HÀNH PHÂN TÍCH
    // ================================================================
    {
        title: "Quyển VI. Thực Hành Phân Tích – Vọng Khúc Thanh Xuân",
        content: `
            <h4>6.1. Văn bản gốc</h4>
            <blockquote style="border-left: 3px solid var(--accent); padding-left: 15px; font-style: italic; margin: 15px 0; color: var(--text-main); line-height: 2;">
                Quạt giấy khép lại mùa thi,<br>Áo dài bay giữa kinh kỳ sắc xuân.<br>Thầy cô tựa ánh trăng ngần,<br>Dắt em qua những thăng trầm thế gian.<br>Lời ru thuở trước vọng vang,<br>Điển xưa tích cũ, hành trang em mang.<br>Nón nghiêng che nắng đường làng,<br>Mai này xa, vẫn ngỡ ngàng nhớ ơn.<br>Dẫu đi muôn nẻo dặm trường,<br>Cội nguồn văn hóa, tình thương thầy cô.
            </blockquote>
            <h4>6.2. Phân tích nhan đề</h4>
            <ul>
                <li><b>Vọng:</b> Hướng về, trông ngóng, hoài niệm.</li>
                <li><b>Khúc:</b> Gợi chỉnh thể âm nhạc.</li>
                <li><b>Thanh xuân:</b> Độ tuổi, miền ký ức.</li>
            </ul>
            <h4>6.3. Phân tích 4 tầng nghệ thuật</h4>
            <ul>
                <li><b>Tính nhạc:</b> Luân phiên 6-8, vần, nhịp thơ.</li>
                <li><b>Điệu thơ:</b> Từ trong trẻo -> trang trọng -> lắng đọng.</li>
                <li><b>Thần thái:</b> Thanh tân, Cổ phong, Trữ tình.</li>
                <li><b>Hồn thơ:</b> Tình (biết ơn), Ý (kế thừa tri thức).</li>
            </ul>
            <h4>6.4. Dưới lăng kính Nho gia</h4>
            <p>Tôn sư trọng đạo, Kế thừa truyền thống, Trách nhiệm. (Lưu ý: Không ép thành lời thề lập công danh).</p>
            <h4>6.5. Dưới lăng kính Đạo gia</h4>
            <p>Mỹ cảm thuận tự nhiên, thanh thoát, tự tại.</p>
        `
    },
    // ================================================================
    // QUYỂN VII: CẨM NANG NGHIÊN CỨU
    // ================================================================
    {
        title: "Quyển VII. Cẩm Nang Vận Dụng Và Phương Pháp Nghiên Cứu",
        content: `
            <h4>7.1. Quy trình đọc hiểu văn bản (7 bước)</h4>
            <ol>
                <li>Nhận diện văn bản (Tác giả, thời đại, văn tự, thể loại).</li>
                <li>Khảo sát cấu trúc (Bố cục, mạch cảm xúc, điểm nhìn).</li>
                <li>Phân tích ngôn ngữ (Từ ngữ, điển tích, tu từ, nhịp vần).</li>
                <li>Giải mã hình tượng (Nghĩa tả thực, biểu tượng, bối cảnh).</li>
                <li>Khảo sát thi pháp (Tính nhạc, điệu, thần thái, hồn thơ).</li>
                <li>Đánh giá tư tưởng (Nho, Đạo, Phật, nhân đạo...).</li>
                <li>Đánh giá nghệ thuật (Thành công, hạn chế, độc đáo).</li>
            </ol>
            <h4>7.2. Quy trình sáng tác (7 giai đoạn)</h4>
            <ol>
                <li>Tìm hạt nhân cảm xúc.</li>
                <li>Mở rộng chân trời liên tưởng.</li>
                <li>Xây dựng hệ thống hình tượng.</li>
                <li>Xác định điệu và tính nhạc.</li>
                <li>Viết và chuyển hóa tri thức.</li>
                <li>Hiệu đính.</li>
                <li>Đọc lại bằng nhiều góc nhìn.</li>
            </ol>
        `
    },
    // ================================================================
    // QUYỂN VIII: TỪ ĐIỂN HÁN VIỆT
    // ================================================================
    {
        title: "Quyển VIII. Từ Điển Hán Việt Trong Thi Ca",
        content: `
            <p><em>Tiếng Việt vay mượn rất nhiều từ Hán Việt. Quyển này tuyển chọn hơn 50 từ/cụm từ Hán Việt thường gặp nhất, phân loại theo chủ đề.</em></p>
            <h4>8.1. Nhóm chỉ Thiên nhiên, Vũ trụ và Sự vô thường</h4>
            <ul>
                <li><b>Càn khôn (乾坤):</b> Trời đất. Chỉ vũ trụ, thế giới bao la.</li>
                <li><b>Thương hải (滄海):</b> Biển xanh. "Thương hải tang điền" chỉ sự biến đổi khôn lường.</li>
                <li><b>Tang điền (桑田):</b> Ruộng dâu. Biểu tượng cho sự thay đổi lớn lao của lịch sử.</li>
                <li><b>Phù vân (浮雲):</b> Mây nổi. Chỉ sự phù du, hư ảo.</li>
                <li><b>Tuyết (雪) / Sương (霜):</b> Tuyết / Sương giá. Tượng trưng cho sự lạnh lẽo, hoặc mái tóc bạc.</li>
            </ul>
            <h4>8.2. Nhóm chỉ Thời gian và Không gian</h4>
            <ul>
                <li><b>Thiên thu (千秋) / Vạn cổ (萬古):</b> Nghìn năm / Muôn đời. Chỉ sự trường tồn vĩnh cửu.</li>
                <li><b>Bạch câu quá khích (白駒過隙):</b> Bóng ngựa trắng lướt qua khe cửa. Chỉ thời gian trôi quá nhanh.</li>
                <li><b>Thiên nhai (天涯):</b> Chân trời. Chỉ nơi xa xôi, cách biệt.</li>
                <li><b>Cố quốc (故國):</b> Đất nước cũ, quê hương cũ.</li>
            </ul>
            <h4>8.3. Nhóm chỉ Con người và Mối quan hệ</h4>
            <ul>
                <li><b>Tri kỷ (知己):</b> Người hiểu rõ lòng mình. Bạn tâm giao.</li>
                <li><b>Cố nhân (故人):</b> Người bạn cũ, người xưa.</li>
                <li><b>Hồng nhan (紅顏):</b> Má hồng. Chỉ người phụ nữ đẹp.</li>
                <li><b>Bạc mệnh (薄命):</b> Số phận mỏng manh, chịu nhiều đau khổ.</li>
                <li><b>Quân tử (君子):</b> Người có phẩm chất đạo đức cao thượng (Nho giáo).</li>
            </ul>
            <h4>8.4. Nhóm chỉ Tâm trạng và Cảm xúc</h4>
            <ul>
                <li><b>Sầu (愁):</b> Nỗi buồn, sự lo lắng, u uất.</li>
                <li><b>Oán (怨):</b> Nỗi oán trách, hờn giận.</li>
                <li><b>Hận (恨):</b> Nỗi hận, sự tiếc nuối vì duyên phận dang dở.</li>
                <li><b>Lệ (淚):</b> Nước mắt.</li>
                <li><b>Hoài (懷):</b> Nhớ nhung, hoài niệm.</li>
            </ul>
            <h4>8.5. Hiệu đính: Các từ đồng âm dễ nhầm lẫn</h4>
            <ul>
                <li><b>Vọng (望):</b> Trông về, ngóng đợi. KHÔNG phải "âm thanh vọng lại".</li>
                <li><b>Khúc (曲):</b> Khúc nhạc, bản nhạc. KHÔNG phải "chặng đường".</li>
                <li><b>Trường (長 / 場):</b> Trường trong "dặm trường" (長) là dài. Trường trong "mái trường" (場) là nơi học tập.</li>
                <li><b>Mai (梅 / 明日):</b> Hoa mai và ngày mai là hai chữ khác nhau.</li>
                <li><b>Thủy (水 / 始):</b> Thủy trong "sông nước" (水) khác "bắt đầu" (始).</li>
            </ul>
        `
    },
    // ================================================================
    // QUYỂN IX: LỊCH SỬ VĂN HỌC VIỆT NAM
    // ================================================================
    {
        title: "Quyển IX. Lịch Sử Văn Học Việt Nam",
        content: `
            <h4>9.1. Văn học dân gian</h4>
            <ul>
                <li>Thần thoại: phản ánh quan niệm về nguồn gốc thế giới.</li>
                <li>Truyền thuyết: phản ánh nhân vật, sự kiện lịch sử qua lăng kính dân gian.</li>
                <li>Cổ tích: thể hiện ước mơ về công lý, hạnh phúc.</li>
                <li>Ngụ ngôn: gửi gắm bài học đạo lý.</li>
                <li>Ca dao, tục ngữ, vè, truyện cười.</li>
            </ul>
            <h4>9.2. Văn học trung đại Việt Nam</h4>
            <ul>
                <li>Thời Lý - Trần: cảm hứng yêu nước, dấu ấn Phật giáo.</li>
                <li>Thời Lê sơ: tư tưởng nhân nghĩa, ý thức quốc gia.</li>
                <li>TK XVI - XVII: suy tư về thời cuộc, nhân sinh.</li>
                <li>TK XVIII - XIX: phát triển chữ Nôm, ý thức cá nhân, tiếng nói nhân đạo.</li>
            </ul>
            <h4>9.3. Văn học hiện đại</h4>
            <ul>
                <li>1900 - 1930: chuyển đổi từ trung đại sang hiện đại.</li>
                <li>1930 - 1945: Thơ Mới, văn học hiện thực phê phán, lãng mạn.</li>
                <li>1945 - 1954: văn học kháng chiến chống Pháp.</li>
                <li>1954 - 1975: văn học thời kỳ chia cắt và chiến tranh.</li>
                <li>1975 - 1986: văn học hậu chiến.</li>
                <li>Từ 1986: văn học Đổi mới, đa dạng hóa.</li>
            </ul>
        `
    },
    // ================================================================
    // QUYỂN X: LỊCH SỬ VĂN HỌC THẾ GIỚI
    // ================================================================
    {
        title: "Quyển X. Lịch Sử Văn Học Thế Giới",
        content: `
            <h4>10.1. Văn học phương Đông cổ đại</h4>
            <ul>
                <li>Ấn Độ: Veda, Upanishad, Mahabharata, Ramayana.</li>
                <li>Trung Hoa: Kinh Thi, Sở Từ.</li>
                <li>Lưỡng Hà: Sử thi Gilgamesh.</li>
            </ul>
            <h4>10.2. Văn học phương Tây cổ đại</h4>
            <ul>
                <li>Hy Lạp: Homer, Sophocles, Aeschylus, Euripides.</li>
                <li>La Mã: Virgil, Horace, Ovid.</li>
            </ul>
            <h4>10.3. Văn học Phục Hưng và Khai sáng</h4>
            <ul>
                <li>Phục Hưng: đề cao con người, lý trí (Dante, Shakespeare).</li>
                <li>Khai sáng: tư duy lý tính, tự do (Voltaire).</li>
            </ul>
            <h4>10.4. Các trào lưu văn học hiện đại</h4>
            <p>Lãng mạn, Hiện thực, Tự nhiên, Tượng trưng, Hiện đại, Hậu hiện đại.</p>
        `
    },
    // ================================================================
    // QUYỂN XI: BÁCH KHOA TÁC GIẢ
    // ================================================================
    {
        title: "Quyển XI. Bách Khoa Tác Giả Văn Học",
        content: `
            <h4>11.1. Hồ sơ tác giả chuẩn</h4>
            <p>Họ tên, bút danh, năm sinh/mất, thời đại, sự nghiệp, tác phẩm tiêu biểu, phong cách, quan niệm văn chương, vị trí lịch sử, tài liệu nghiên cứu.</p>
            <h4>11.2. Tác giả văn học Việt Nam</h4>
            <ul>
                <li>Trung đại: Nguyễn Trãi, Nguyễn Du, Hồ Xuân Hương, Nguyễn Khuyến.</li>
                <li>Thơ Mới: Xuân Diệu, Huy Cận, Hàn Mặc Tử, Chế Lan Viên.</li>
                <li>Văn xuôi: Nam Cao, Ngô Tất Tố, Vũ Trọng Phụng, Thạch Lam.</li>
                <li>Kháng chiến: Chính Hữu, Quang Dũng, Tố Hữu, Phạm Tiến Duật.</li>
            </ul>
            <h4>11.3. Tác giả văn học thế giới</h4>
            <ul>
                <li>Trung Hoa: Lý Bạch, Đỗ Phủ.</li>
                <li>Ấn Độ: Tagore.</li>
                <li>Châu Âu: Shakespeare, Dante, Goethe, Victor Hugo.</li>
                <li>Nga: Pushkin, Dostoevsky, Tolstoy, Chekhov.</li>
            </ul>
            <h4>11.4. Phân định mức độ xác thực</h4>
            <p>Thông tin tiểu sử, tên thật, niên đại phải được kiểm chứng. Với trường hợp còn tranh luận, phải ghi rõ các giả thuyết và căn cứ.</p>
        `
    },
    // ================================================================
    // QUYỂN XII: BÁCH KHOA TÁC PHẨM
    // ================================================================
    {
        title: "Quyển XII. Bách Khoa Tác Phẩm Văn Học",
        content: `
            <h4>12.1. Hồ sơ tác phẩm chuẩn</h4>
            <p>Tên, tác giả, thời điểm, ngôn ngữ, thể loại, hoàn cảnh, tóm tắt, chủ đề, giá trị, lịch sử tiếp nhận, dị bản.</p>
            <h4>12.2. Phân loại tác phẩm</h4>
            <p>Dân gian, Trung đại, Hiện đại, Đương đại, Việt Nam, Thế giới.</p>
            <h4>12.3. Nguyên tắc thẩm định</h4>
            <p>Không đánh đồng ngày sáng tác, công bố, xuất bản và lưu truyền. Tác phẩm có nhiều dị bản phải ghi nhận lịch sử văn bản.</p>
        `
    },
    // ================================================================
    // QUYỂN XIII: LÝ LUẬN VÀ THUẬT NGỮ
    // ================================================================
    {
        title: "Quyển XIII. Bách Khoa Lý Luận Và Thuật Ngữ Văn Học",
        content: `
            <h4>13.1. Lý luận văn học</h4>
            <p>Bản chất, chức năng, mối quan hệ với hiện thực, tác giả, tác phẩm, người đọc, phong cách.</p>
            <h4>13.2. Hệ thống khái niệm thi pháp</h4>
            <p>Hình tượng, chủ thể trữ tình, điểm nhìn, giọng điệu, kết cấu, không gian/thời gian, liên văn bản, biểu tượng, mô-típ.</p>
            <h4>13.3. Các trường phái phê bình</h4>
            <p>Tiểu sử, Xã hội học, Phân tâm học, Cấu trúc luận, Hình thức luận, Ký hiệu học, Hậu cấu trúc, Sinh thái, Nữ quyền, Hậu thuộc địa.</p>
        `
    },
    // ================================================================
    // QUYỂN XIV: NGÔN NGỮ HỌC VÀ VĂN BẢN HỌC
    // ================================================================
    {
        title: "Quyển XIV. Ngôn Ngữ Học Và Văn Bản Học",
        content: `
            <h4>14.1. Ngôn ngữ học đại cương</h4>
            <p>Ngữ âm, âm vị, hình thái, từ vựng, ngữ nghĩa, ngữ pháp, ngữ dụng, phong cách, lịch sử.</p>
            <h4>14.2. Từ vựng tiếng Việt</h4>
            <p>Từ đơn, từ ghép, từ láy, từ thuần Việt, Hán Việt, từ mượn, thành ngữ.</p>
            <h4>14.3. Hệ thống văn tự</h4>
            <p>Chữ Hán, chữ Nôm, chữ Quốc ngữ. Phiên âm, phiên thiết, dịch nghĩa.</p>
            <h4>14.4. Văn bản học</h4>
            <p>Quá trình hình thành, lưu truyền, sao chép, khắc in, chỉnh lý, hiệu đính và truyền bản. Khảo dị, xác định dị bản.</p>
        `
    },
    // ================================================================
    // QUYỂN XV: TRIẾT HỌC, TÔN GIÁO VÀ VĂN HÓA
    // ================================================================
    {
        title: "Quyển XV. Bách Khoa Triết Học, Tôn Giáo Và Văn Hóa",
        content: `
            <h4>15.1. Triết học phương Đông</h4>
            <p>Nho học (Khổng Tử, Mạnh Tử), Đạo gia (Lão Tử, Trang Tử), Phật học.</p>
            <h4>15.2. Triết học phương Tây</h4>
            <p>Hy Lạp cổ đại, trung đại, Phục Hưng, Khai sáng, duy tâm, duy vật, hiện sinh.</p>
            <h4>15.3. Tôn giáo và tín ngưỡng</h4>
            <p>Lịch sử, giáo lý, nghi lễ, biểu tượng, ảnh hưởng đến văn học.</p>
            <h4>15.4. Văn hóa Việt Nam</h4>
            <p>Văn hóa làng xã, phong tục, lễ hội, di sản truyền khẩu, mỹ thuật truyền thống.</p>
        `
    },
    // ================================================================
    // QUYỂN XVI: NGHỆ THUẬT VÀ MỸ HỌC LIÊN NGÀNH
    // ================================================================
    {
        title: "Quyển XVI. Bách Khoa Nghệ Thuật Và Mỹ Học",
        content: `
            <h4>16.1. Mỹ học đại cương</h4>
            <p>Cái đẹp, cái bi, cái hài, cái cao cả. Trải nghiệm thẩm mỹ.</p>
            <h4>16.2. Hội họa và mỹ thuật</h4>
            <p>Hội họa phương Đông/Tây, sơn thủy, thủy mặc, thư pháp, tranh dân gian.</p>
            <h4>16.3. Âm nhạc</h4>
            <p>Nhạc lý, nhịp, tiết tấu, âm nhạc truyền thống, mối quan hệ thơ - nhạc.</p>
            <h4>16.4. Kiến trúc, điêu khắc, sân khấu, điện ảnh</h4>
            <p>Chèo, tuồng, cải lương, ngôn ngữ điện ảnh, chuyển thể văn học.</p>
        `
    },
    // ================================================================
    // QUYỂN XVII: PHƯƠNG PHÁP KHẢO CỨU VÀ TRA CỨU
    // ================================================================
    {
        title: "Quyển XVII. Phương Pháp Khảo Cứu, Kiểm Chứng Và Tra Cứu",
        content: `
            <h4>17.1. Nguyên tắc xác minh</h4>
            <p>Xem xét nguồn gốc, độ tin cậy, tính độc lập và khả năng đối chiếu.</p>
            <h4>17.2. Phân cấp thông tin</h4>
            <ul>
                <li><b>Dữ kiện đã xác minh:</b> Có nguồn đáng tin cậy.</li>
                <li><b>Thông tin có căn cứ:</b> Được hỗ trợ nhưng cần khảo cứu.</li>
                <li><b>Giả thuyết học thuật:</b> Có lập luận, chưa đồng thuận.</li>
                <li><b>Diễn giải / Cảm nhận:</b> Cách đọc, phản ứng chủ quan.</li>
            </ul>
            <h4>17.3. Phân cấp nguồn tư liệu</h4>
            <ol>
                <li>Văn bản gốc, bản khắc, bản chép.</li>
                <li>Công trình khảo cứu chuyên môn, ấn bản chú giải.</li>
                <li>Giáo trình, từ điển chuyên ngành.</li>
                <li>Bài báo khoa học có thẩm định.</li>
            </ol>
            <h4>17.4. Chuẩn trích dẫn và quản lý phiên bản</h4>
            <p>Ghi rõ tác giả, tên tài liệu, năm xuất bản, số trang. Mọi thay đổi phải có lịch sử chỉnh sửa. Một mục từ hoàn thiện khi có định nghĩa, phạm vi, nguồn tham khảo và liên kết.</p>
        `
    }
];

/* =====================================================================
   VĂN ĐẠO ENGINE - HỆ THỐNG QUẢN TRỊ TRI THỨC VÀ KIỂM CHỨNG
   ===================================================================== */
const ENCYCLOPEDIA_CONFIG = {
    name: "ĐẠI BÁCH KHOA VĂN ĐẠO",
    subtitle: "Văn học - Ngôn ngữ - Triết học - Lịch sử - Văn hóa - Nghệ thuật",
    version: "2.0.0",
    scope: [
        "Văn học Việt Nam", "Văn học thế giới", "Ngôn ngữ học", "Văn bản học", 
        "Triết học", "Tôn giáo và tín ngưỡng", "Lịch sử và văn hóa", 
        "Mỹ học và nghệ thuật", "Lý luận và phê bình văn học"
    ],
    principles: [
        "Tính chính xác", "Tính khách quan", "Tính hệ thống", 
        "Tính toàn diện trong phạm vi chuyên ngành", "Tính liên ngành", 
        "Tính kế thừa", "Tính cập nhật", "Tính kiểm chứng"
    ],
    editorialRules: {
        noFabrication: true,
        distinguishFactAndInterpretation: true,
        preserveOriginalTexts: true,
        identifyDisputedInformation: true,
        citeResearchSources: true,
        recordRevisionHistory: true,
        preserveAlternativeInterpretations: true
    }
};

const ENCYCLOPEDIA_EVIDENCE_LEVELS = [
    { id: "E1", name: "Đã xác minh", description: "Có căn cứ đáng tin cậy, có thể đối chiếu trực tiếp." },
    { id: "E2", name: "Có căn cứ", description: "Có nguồn hỗ trợ nhưng cần kiểm tra thêm." },
    { id: "E3", name: "Còn tranh luận", description: "Có nhiều quan điểm học thuật khác nhau." },
    { id: "E4", name: "Chưa xác minh", description: "Chưa tìm được tài liệu đủ để xác nhận." },
    { id: "E5", name: "Diễn giải", description: "Nhận định của người nghiên cứu, không phải dữ kiện lịch sử." }
];

const ENCYCLOPEDIA_CROSS_REFERENCE_DATA = [
    { from: "Thi pháp học", relation: "related-to", to: "Mỹ học" },
    { from: "Văn bản học", relation: "supports", to: "Khảo cứu văn học" },
    { from: "Hán Việt", relation: "related-to", to: "Hán Nôm" },
    { from: "Biểu tượng nghệ thuật", relation: "related-to", to: "Văn hóa học" },
    { from: "Nho gia", relation: "related-to", to: "Triết học phương Đông" },
    { from: "Đạo gia", relation: "related-to", to: "Lịch sử tư tưởng" },
    { from: "Phật giáo", relation: "related-to", to: "Tôn giáo học" }
];

const ENCYCLOPEDIA_CHANGELOG = [
    {
        version: "2.0.0",
        date: "2026-11-09",
        type: "major-update",
        description: "Mở rộng lên 18 Quyển, tích hợp Hệ thống Quản trị Tri thức, bổ sung Quyển IX - XVII."
    },
    {
        version: "1.0.0",
        date: null,
        type: "initial-release",
        description: "Khởi tạo 8 Quyển nền tảng ban đầu."
    }
];

const HERITAGE_CATEGORY_DATA = [
    { id: "dan-gian", name: "Văn học dân gian" },
    { id: "trung-dai", name: "Văn học trung đại" },
    { id: "hien-dai", name: "Văn học hiện đại" },
    { id: "the-gioi", name: "Văn học thế giới" },
    { id: "ca-dao", name: "Ca dao - Tục ngữ" },
    { id: "dien-tich", name: "Điển tích - Điển cố" },
    { id: "truyen-cuoi", name: "Truyện cười dân gian" },
    { id: "ngu-ngon", name: "Truyện ngụ ngôn" }
];