/* =========================================
   KHO DỮ LIỆU VĂN ĐẠO ENGINE
   (Trái tim tri thức - Bảo vệ dữ liệu tuyệt đối)
   ========================================= */

// 1. DỮ LIỆU VĂN HIẾN (MỞ RỘNG 24 TÁC PHẨM & PHÂN LOẠI)
const HERITAGE_DATA = [
    // --- VĂN HỌC DÂN GIAN ---
    { title: "Con Rồng Cháu Tiên", author: "Dân gian", genre: "Truyền thuyết", era: "Thời Hồng Bàng", script: "Truyền miệng", desc: "Giải thích nguồn gốc cao quý của dân tộc Việt Nam.", category: "dan-gian" },
    { title: "Sơn Tinh Thủy Tinh", author: "Dân gian", genre: "Truyền thuyết", era: "Thời Hùng Vương", script: "Truyền miệng", desc: "Ca ngợi công cuộc trị thủy và bảo vệ đất nước của cha ông.", category: "dan-gian" },
    { title: "Tấm Cám", author: "Dân gian", genre: "Cổ tích", era: "Không rõ", script: "Truyền miệng", desc: "Hành trình đấu tranh giành hạnh phúc của cô Tấm.", category: "dan-gian" },
    { title: "Thạch Sanh", author: "Dân gian", genre: "Cổ tích", era: "Không rõ", script: "Truyền miệng", desc: "Người hùng diệt chằn tinh, đại bàng và đánh đuổi giặc ngoại xâm.", category: "dan-gian" },
    { title: "Truyện Trê Cóc", author: "Dân gian", genre: "Truyện thơ Nôm", era: "Không rõ", script: "Chữ Nôm", desc: "Tác phẩm trào phúng sâu sắc về xã hội phong kiến.", category: "dan-gian" },

    // --- VĂN HỌC TRUNG ĐẠI ---
    { title: "Nam quốc sơn hà", author: "Lý Thường Kiệt", genre: "Thất ngôn tứ tuyệt", era: "Nhà Lý", script: "Chữ Hán", desc: "Bản tuyên ngôn độc lập đầu tiên, khẳng định chủ quyền.", category: "trung-dai" },
    { title: "Hịch tướng sĩ", author: "Trần Quốc Tuấn", genre: "Hịch", era: "Nhà Trần", script: "Chữ Hán", desc: "Lời kêu gọi tinh thần yêu nước, quyết chiến chống quân Nguyên Mông.", category: "trung-dai" },
    { title: "Phò giá về kinh", author: "Trần Quang Khải", genre: "Ngũ ngôn tứ tuyệt", era: "Nhà Trần", script: "Chữ Hán", desc: "Hào khí chiến thắng và khát vọng thái bình thịnh trị.", category: "trung-dai" },
    { title: "Bình Ngô Đại Cáo", author: "Nguyễn Trãi", genre: "Cáo", era: "Nhà Lê sơ", script: "Chữ Hán", desc: "Áng văn chính luận mẫu mực, tuyên bố chiến thắng quân Minh.", category: "trung-dai" },
    { title: "Truyện Kiều", author: "Nguyễn Du", genre: "Lục bát", era: "Triều Nguyễn", script: "Chữ Nôm", desc: "Tác phẩm kiệt xuất nhất của văn học trung đại Việt Nam.", category: "trung-dai" },
    { title: "Chinh Phụ Ngâm", author: "Đặng Trần Côn", genre: "Song thất lục bát", era: "TK 18", script: "Chữ Hán / Nôm", desc: "Khúc ngâm về nỗi sầu muộn của người vợ chờ chồng đi chinh chiến.", category: "trung-dai" },
    { title: "Qua Đèo Ngang", author: "Bà Huyện Thanh Quan", genre: "Đường luật", era: "Triều Nguyễn", script: "Chữ Nôm", desc: "Bức tranh thiên nhiên và tâm trạng hoài cổ, cô đơn.", category: "trung-dai" },
    { title: "Bánh Trôi Nước", author: "Hồ Xuân Hương", genre: "Thất ngôn tứ tuyệt", era: "Cuối Lê - Đầu Nguyễn", script: "Chữ Nôm", desc: "Tiếng nói bênh vực và ca ngợi vẻ đẹp người phụ nữ.", category: "trung-dai" },
    { title: "Nhàn", author: "Nguyễn Bỉnh Khiêm", genre: "Đường luật", era: "Nhà Mạc", script: "Chữ Nôm", desc: "Vẻ đẹp thanh cao, tâm thế nhàn dật của kẻ sĩ.", category: "trung-dai" },

    // --- VĂN HỌC HIỆN ĐẠI ---
    { title: "Chí Phèo", author: "Nam Cao", genre: "Truyện ngắn", era: "1941", script: "Quốc ngữ", desc: "Bi kịch của người nông dân bị tha hóa bởi xã hội phong kiến.", category: "hien-dai" },
    { title: "Số Đỏ", author: "Vũ Trọng Phụng", genre: "Tiểu thuyết", era: "1936", script: "Quốc ngữ", desc: "Bức tranh trào phúng sâu sắc về xã hội tư sản thành thị.", category: "hien-dai" },
    { title: "Vội Vàng", author: "Xuân Diệu", genre: "Thơ tự do", era: "Thơ Mới (1938)", script: "Quốc ngữ", desc: "Khát vọng sống mãnh liệt, cuồng nhiệt trước vẻ đẹp cuộc đời.", category: "hien-dai" },
    { title: "Đây Thôn Vĩ Dạ", author: "Hàn Mặc Tử", genre: "Thất ngôn bát cú", era: "Thơ Mới (1938)", script: "Quốc ngữ", desc: "Bức tranh xứ Huế mộng mơ và nỗi niềm thi sĩ.", category: "hien-dai" },
    { title: "Tây Tiến", author: "Quang Dũng", genre: "Thơ tự do", era: "Kháng chiến Pháp", script: "Quốc ngữ", desc: "Bài thơ lãng mạn, bi tráng về người lính và núi rừng Tây Bắc.", category: "hien-dai" },
    { title: "Đồng Chí", author: "Chính Hữu", genre: "Thơ tự do", era: "Kháng chiến Pháp", script: "Quốc ngữ", desc: "Tình đồng đội thiêng liêng, gắn bó keo sơn nơi chiến hào.", category: "hien-dai" },
    { title: "Nhật Ký Trong Tù", author: "Hồ Chí Minh", genre: "Thất ngôn tứ tuyệt", era: "1942-1943", script: "Chữ Hán", desc: "Tinh thần lạc quan, ý chí kiên cường của người tù cách mạng.", category: "hien-dai" },

    // --- VĂN HỌC THẾ GIỚI ---
    { title: "Tĩnh Dạ Tứ", author: "Lý Bạch", genre: "Ngũ ngôn tứ tuyệt", era: "Thịnh Đường", script: "Chữ Hán", desc: "Nỗi nhớ quê hương da diết của thi tiên Lý Bạch.", category: "the-gioi" },
    { title: "Thần Khúc", author: "Dante", genre: "Trường ca", era: "Thời Phục Hưng", script: "Tiếng Ý", desc: "Hành trình qua Địa ngục, Luyện ngục và Thiên đường.", category: "the-gioi" },
    { title: "Hamlet", author: "Shakespeare", genre: "Bi kịch", era: "TK 16-17", script: "Tiếng Anh", desc: "Vở kịch kinh điển về sự trả thù và những trăn trở triết học.", category: "the-gioi" },
    { title: "Hoàng Tử Bé", author: "Antoine de Saint-Exupéry", genre: "Tiểu thuyết", era: "1943", script: "Tiếng Pháp", desc: "Câu chuyện triết lý sâu sắc dành cho cả người lớn và trẻ em.", category: "the-gioi" }
];

// 2. DỮ LIỆU ĐẠI BÁCH KHOA (8 QUYỂN)
const ENCYCLOPEDIA_DATA = [
    {
        title: "Quyển 0. Tâm Thư – Tuyên Ngôn Nền Tảng",
        content: `
            <h4>0.1. Tuyên ngôn học tập và sáng tạo</h4>
            <p>"Học rộng để có nhiều chân trời, học sâu để thấu bản chất, cảm thụ tinh tế để nhận ra vẻ đẹp, sáng tạo độc lập để hình thành phong cách."</p>
            <p>"Điều đáng quý nhất ở một thi nhân không phải là họ nhìn thấy bao nhiêu điều trong một ánh trăng, mà là họ có thể khiến người đọc nhìn thấy một ánh trăng chưa từng được cảm nhận theo cách ấy."</p>
            <p>"Tri thức giúp câu thơ có chiều sâu; cảm xúc giúp câu thơ có linh hồn; sự tiết chế giúp câu thơ sống lâu trong lòng người đọc. Đừng biến kho điển tích thành nơi phô diễn kiến thức. Một ánh trăng đúng chỗ đôi khi có sức gợi hơn mười điển cố được đặt cạnh nhau."</p>
            <p>"Nho gia là đạo lý để bước vào đời; Đạo gia là một tâm thế để đi qua đời."</p>
            
            <h4>0.2. Quan niệm về người sáng tác (5 năng lực cốt lõi)</h4>
            <ul>
                <li><b>Năng lực quan sát:</b> Nhìn thấy những chi tiết, sắc thái và biến chuyển mà người khác dễ bỏ qua.</li>
                <li><b>Năng lực cảm thụ:</b> Nhận biết vẻ đẹp, nỗi buồn, sự tinh tế và những rung động của con người, thiên nhiên, văn hóa.</li>
                <li><b>Năng lực tri thức:</b> Hiểu biết về lịch sử, văn học, triết học, tôn giáo, mỹ học và đời sống.</li>
                <li><b>Năng lực liên tưởng:</b> Kết nối những sự vật, hình tượng và hệ tư tưởng tưởng như xa cách.</li>
                <li><b>Năng lực sáng tạo:</b> Biến những gì đã học và đã cảm nhận thành một thế giới nghệ thuật có dấu ấn riêng.</li>
            </ul>
            <h4>0.3. Nguyên lý sáng tạo</h4>
            <p>Tri thức là phương tiện mở rộng khả năng sáng tạo, không phải vật trang sức cho câu thơ. Cảm xúc là nguồn năng lượng của tác phẩm, còn kỹ thuật nghệ thuật là phương tiện giúp cảm xúc đạt đến hình thức biểu đạt tinh tế.</p>
        `
    },
    {
        title: "Quyển I. Sáu Nguyên Tắc Học Thuật Cốt Lõi",
        content: `
            <p><em>(Bộ lọc bắt buộc trong mọi hoạt động đọc hiểu, phân tích và sáng tác)</em></p>
            <h4>1.1. Phân định văn tự và bối cảnh văn học</h4>
            <p>Không đồng nhất những tác phẩm có hình thức gần nhau nhưng thuộc những truyền thống văn học khác nhau (Văn học chữ Hán của Việt Nam, Văn học chữ Nôm của Việt Nam, Văn học chữ Hán của Trung Hoa, Thơ Đường Trung Hoa, Thơ Nôm Đường luật Việt Nam).</p>
            <h4>1.2. Phân biệt thể loại, thể thơ và luật thơ</h4>
            <p>Tuyệt đối không dùng ba khái niệm này thay thế cho nhau. Thể loại (Tự sự, Trữ tình, Kịch, Văn chính luận) - Thể thơ (Lục bát, Song thất lục bát, Ngũ ngôn...) - Luật thơ (Hệ thống quy tắc về thanh điệu, vần, niêm, đối).</p>
            <h4>1.3. Thận trọng khi sử dụng khái niệm phá cách</h4>
            <p>Một tác phẩm không tuân thủ quy tắc truyền thống chưa đương nhiên là một tác phẩm phá cách có chủ ý. Nếu chưa đủ căn cứ, nên dùng các cách diễn đạt trung tính như: hình thức biến thể, cách tổ chức phóng khoáng.</p>
            <h4>1.4. Tiết chế điển tích và điển cố</h4>
            <p>Một điển tích có giá trị khi nó tạo thêm chiều sâu cho hình tượng, chứ không chỉ chứng minh người viết có nhiều kiến thức.</p>
            <h4>1.5. Tôn trọng tính đa nghĩa của biểu tượng</h4>
            <p>Biểu tượng nghệ thuật không phải một công thức giải mã cố định. Ý nghĩa cụ thể phải được xác định từ văn cảnh, chủ thể trữ tình, truyền thống văn hóa và cấu trúc tác phẩm.</p>
            <h4>1.6. Phân biệt sự thật, giả thuyết và diễn giải</h4>
            <p>Mọi nhận định học thuật nên được phân thành bốn cấp: Dữ kiện (có căn cứ văn bản/lịch sử) -> Giả thuyết -> Diễn giải -> Cảm nhận.</p>
        `
    },
    {
        title: "Quyển II. Thi Pháp Học Và Mỹ Học",
        content: `
            <h4>2.2. Hệ thống bốn tầng phân tích âm hưởng và sức sống thi ca</h4>
            <ul>
                <li><b>Tầng 1. Tính nhạc:</b> Thanh điệu (Bằng/Trắc), Vần, Nhịp, Phối âm, Điệp âm.</li>
                <li><b>Tầng 2. Điệu thơ:</b> Sắc điệu cảm xúc (Trang trọng, Trữ tình, U hoài, Bi tráng...).</li>
                <li><b>Tầng 3. Thần thái:</b> Khí chất nghệ thuật (Cổ phong, Thanh tân, Thanh nhã...).</li>
                <li><b>Tầng 4. Hồn thơ:</b> Sự hòa quyện của Tình, Ý, Cảnh, Điệu, Thần.</li>
            </ul>
            <h4>2.3. Các cặp phạm trù thi pháp</h4>
            <p>Tĩnh và Động (Dĩ động tả tĩnh). Không gian & Thời gian nghệ thuật. Tả cảnh ngụ tình. Hàm súc và ý tại ngôn ngoại. Thi trung hữu họa / Thi trung hữu nhạc.</p>
        `
    },
    {
        title: "Quyển III. Chuyên Đề Tam Giáo – Nho, Đạo, Phật",
        content: `
            <h4>3.2. Nho gia – Đạo lý để bước vào đời</h4>
            <p><b>Cốt lõi:</b> Ngũ thường (Nhân, Nghĩa, Lễ, Trí, Tín). Chuỗi Cách vật - Trí tri - Thành ý - Chính tâm - Tu thân - Tề gia - Trị quốc - Bình thiên hạ. Không đồng nhất công danh với danh vọng cá nhân.</p>
            <h4>3.3. Đạo gia – Tâm thế để đi qua đời</h4>
            <p><b>Cốt lõi:</b> Đạo, Vô vi, Tự nhiên, Tiêu dao, Tề vật. "Thượng thiện nhược thủy". Tâm thế nhàn dật, hòa hợp thiên nhiên, chất vấn danh lợi.</p>
            <h4>3.4. Phật giáo – Chiêm nghiệm, từ bi và giải thoát</h4>
            <p><b>Cốt lõi:</b> Tứ diệu đế, Duyên khởi, Vô thường, Vô ngã, Nghiệp, Từ bi, Bát chính đạo. Không đồng nhất vô thường với bi quan.</p>
            <h4>3.5. Sự giao thoa Tam giáo</h4>
            <p>Không hiểu "Tam giáo đồng nguyên" theo nghĩa ba truyền thống hoàn toàn giống nhau hoặc có chung một nguồn gốc lịch sử.</p>
        `
    },
    {
        title: "Quyển IV. Văn Học Sử Và Phân Định Thể Loại",
        content: `
            <h4>4.1. Hệ thống thể loại văn học</h4>
            <p><b>Tự sự:</b> Truyện ngắn, Tiểu thuyết, Truyện thơ, Sử thi...<br><b>Trữ tình:</b> Thơ trữ tình, Khúc ngâm, Thơ triết lý...<br><b>Kịch:</b> Bi kịch, Hài kịch, Chính kịch.<br><b>Văn chính luận:</b> Cáo, Hịch, Chiếu, Biểu, Tấu, Sớ.</p>
            <h4>4.3. Phân định các tác phẩm tiêu biểu</h4>
            <ul>
                <li><b>Nam quốc sơn hà:</b> Thơ chữ Hán, thất ngôn tứ tuyệt.</li>
                <li><b>Bình Ngô đại cáo:</b> Văn chính luận, thể cáo, chữ Hán.</li>
                <li><b>Truyện Kiều:</b> Truyện thơ Nôm, lục bát.</li>
                <li><b>Chinh phụ ngâm:</b> Ngâm khúc, bản diễn Nôm dùng song thất lục bát.</li>
                <li><b>Tây Tiến:</b> Thơ kháng chiến chống Pháp (Không xếp vào Thơ Mới).</li>
            </ul>
        `
    },
    {
        title: "Quyển V. Từ Điển Biểu Tượng Và Ngôn Ngữ Nghệ Thuật",
        content: `
            <h4>5.2. Hệ thống biểu tượng Á Đông</h4>
            <p><b>Tứ quý:</b> Tùng (bền bỉ), Cúc (thanh cao), Trúc (ngay thẳng), Mai (sức sống).</p>
            <p><b>Khác:</b> Trăng (hoài niệm, đoàn viên), Liễu (chia biệt), Đào (tuổi trẻ), Sen (thanh khiết), Hạc (thanh cao), Nhạn (tin tức), Mây (phiêu du), Nước (thời gian), Thuyền (hành trình).</p>
            <h4>5.3. Từ điển Hán Việt trong thi ca</h4>
            <ul>
                <li><b>Vọng (望):</b> Trông về, ngóng đợi. Không mặc nhiên đồng nghĩa với âm thanh vọng lại.</li>
                <li><b>Khúc (曲):</b> Khúc nhạc, bản nhạc. Không mặc nhiên mang nghĩa chặng đường.</li>
                <li><b>Trường (長 / 場):</b> "Dặm trường" (長) là dài. "Mái trường" (場) là nơi học tập.</li>
            </ul>
            <h4>5.5. Phương pháp giải mã biểu tượng (5 câu hỏi)</h4>
            <p>1. Nghĩa tả thực là gì? 2. Lịch sử biểu tượng trong văn hóa? 3. Bối cảnh xuất hiện? 4. Liên hệ với cảm xúc chủ thể? 5. Ý nghĩa riêng tác phẩm tạo ra?</p>
        `
    },
    {
        title: "Quyển VI. Thực Hành Phân Tích – Vọng Khúc Thanh Xuân",
        content: `
            <h4>Văn bản gốc</h4>
            <p><em>Quạt giấy khép lại mùa thi,<br>Áo dài bay giữa kinh kỳ sắc xuân.<br>Thầy cô tựa ánh trăng ngần,<br>Dắt em qua những thăng trầm thế gian.<br>Lời ru thuở trước vọng vang,<br>Điển xưa tích cũ, hành trang em mang.<br>Nón nghiêng che nắng đường làng,<br>Mai này xa, vẫn ngỡ ngàng nhớ ơn.<br>Dẫu đi muôn nẻo dặm trường,<br>Cội nguồn văn hóa, tình thương thầy cô.</em></p>
            <h4>6.3. Phân tích hình thức</h4>
            <p>Bài thơ có 10 dòng, luân phiên 6 và 8 tiếng. Gọi chính xác là hình thức sáu-tám, gần với lục bát. Cần kiểm tra hệ thống vần trước khi kết luận là lục bát chuẩn hay biến thể.</p>
            <h4>6.4. Hệ thống hình tượng</h4>
            <p>Quạt giấy (văn hóa, khép lại), Áo dài (vẻ đẹp tuổi trẻ), Ánh trăng (người thầy soi sáng), Lời ru (cội nguồn dân gian), Nón nghiêng/đường làng (không gian làng quê).</p>
            <h4>6.7. Dưới lăng kính Đạo gia</h4>
            <p>Sự chuyển mùa, vẻ đẹp tự nhiên, áo dài bay, ánh trăng thanh tĩnh, không gian làng quê. Mỹ cảm thuận tự nhiên, thanh thoát, tự tại.</p>
        `
    },
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
            <h4>7.4. Nguồn tri thức ưu tiên</h4>
            <ol>
                <li>Văn bản gốc và bản dịch có chú giải.</li>
                <li>Từ điển chuyên ngành và công trình khảo cứu.</li>
                <li>Giáo trình đại học và sách nghiên cứu.</li>
                <li>Bài báo khoa học có phản biện.</li>
                <li>Tài liệu phổ thông có nguồn trích dẫn rõ ràng.</li>
            </ol>
        `
    }
];

// 3. DỮ LIỆU TRÍCH DẪN (QUOTES)
const QUOTES_DATA = [
    { text: "Văn học là nhân học.", author: "M. Gorky" },
    { text: "Thơ là tiếng nói của tâm hồn.", author: "Khuyết danh" },
    { text: "Đọc sách không chỉ để lấy kiến thức, mà để học cách làm người.", author: "Khổng Tử" },
    { text: "Thi trung hữu họa, thi trung hữu nhạc.", author: "Cổ nhân" },
    { text: "Học rộng để nhìn thấy nhiều chân trời, học sâu để hiểu được bản chất.", author: "Văn Đạo Tuyên Ngôn" }
];

// 4. TỪ KHÓA CHẠY NGANG (MARQUEE)
const MARQUEE_KEYWORDS = [
    "Thơ Đường Luật", 
    "Truyện Kiều", 
    "Nho - Đạo - Phật", 
    "Biểu tượng Á Đông", 
    "Thi pháp học", 
    "Thất ngôn bát cú", 
    "Lục bát", 
    "Văn học dân gian",
    "Tản Đà",
    "Thơ Mới",
    "Nam Cao",
    "Xuân Diệu"
];