/* =========================================
   KHO DỮ LIỆU VĂN ĐẠO ENGINE
   (Trái tim tri thức - Bảo vệ dữ liệu tuyệt đối)
   ========================================= */

// 1. DỮ LIỆU VĂN HIẾN (24 TÁC PHẨM & PHÂN LOẠI)
const HERITAGE_DATA = [
    // --- VĂN HỌC DÂN GIAN ---
    { title: "Con Rồng Cháu Tiên", author: "Dân gian", genre: "Truyền thuyết", era: "Thời Hồng Bàng", script: "Truyền miệng", desc: "Giải thích nguồn gốc cao quý của dân tộc Việt Nam, phản ánh ý thức cộng đồng.", category: "dan-gian" },
    { title: "Sơn Tinh Thủy Tinh", author: "Dân gian", genre: "Truyền thuyết", era: "Thời Hùng Vương", script: "Truyền miệng", desc: "Ca ngợi công cuộc trị thủy và bảo vệ đất nước của cha ông ta.", category: "dan-gian" },
    { title: "Tấm Cám", author: "Dân gian", genre: "Cổ tích", era: "Không rõ", script: "Truyền miệng", desc: "Hành trình đấu tranh giành hạnh phúc của cô Tấm, thể hiện khát vọng công lý.", category: "dan-gian" },
    { title: "Thạch Sanh", author: "Dân gian", genre: "Cổ tích", era: "Không rõ", script: "Truyền miệng", desc: "Người hùng diệt chằn tinh, đại bàng và đánh đuổi giặc ngoại xâm.", category: "dan-gian" },
    { title: "Truyện Trê Cóc", author: "Dân gian", genre: "Truyện thơ Nôm", era: "Không rõ", script: "Chữ Nôm", desc: "Tác phẩm trào phúng sâu sắc về xã hội phong kiến đầy bất công.", category: "dan-gian" },

    // --- VĂN HỌC TRUNG ĐẠI ---
    { title: "Nam quốc sơn hà", author: "Lý Thường Kiệt", genre: "Thất ngôn tứ tuyệt", era: "Nhà Lý", script: "Chữ Hán", desc: "Bản tuyên ngôn độc lập đầu tiên, khẳng định chủ quyền lãnh thổ và ý chí quyết chiến.", category: "trung-dai" },
    { title: "Hịch tướng sĩ", author: "Trần Quốc Tuấn", genre: "Hịch", era: "Nhà Trần", script: "Chữ Hán", desc: "Lời kêu gọi tinh thần yêu nước, quyết chiến chống quân Nguyên Mông xâm lược.", category: "trung-dai" },
    { title: "Phò giá về kinh", author: "Trần Quang Khải", genre: "Ngũ ngôn tứ tuyệt", era: "Nhà Trần", script: "Chữ Hán", desc: "Hào khí chiến thắng và khát vọng thái bình thịnh trị của dân tộc.", category: "trung-dai" },
    { title: "Bình Ngô Đại Cáo", author: "Nguyễn Trãi", genre: "Cáo", era: "Nhà Lê sơ", script: "Chữ Hán", desc: "Áng văn chính luận mẫu mực, tuyên bố chiến thắng quân Minh và khẳng định nền độc lập.", category: "trung-dai" },
    { title: "Truyện Kiều", author: "Nguyễn Du", genre: "Lục bát", era: "Triều Nguyễn", script: "Chữ Nôm", desc: "Tác phẩm kiệt xuất nhất của văn học trung đại Việt Nam, kể về cuộc đời gian truân của Thúy Kiều.", category: "trung-dai" },
    { title: "Chinh Phụ Ngâm", author: "Đặng Trần Côn", genre: "Song thất lục bát", era: "TK 18", script: "Chữ Hán / Nôm", desc: "Khúc ngâm về nỗi sầu muộn, cô đơn của người vợ chờ chồng đi chinh chiến.", category: "trung-dai" },
    { title: "Qua Đèo Ngang", author: "Bà Huyện Thanh Quan", genre: "Đường luật", era: "Triều Nguyễn", script: "Chữ Nôm", desc: "Bức tranh thiên nhiên và tâm trạng hoài cổ, cô đơn của tác giả khi dừng chân trên đèo.", category: "trung-dai" },
    { title: "Bánh Trôi Nước", author: "Hồ Xuân Hương", genre: "Thất ngôn tứ tuyệt", era: "Cuối Lê - Đầu Nguyễn", script: "Chữ Nôm", desc: "Tiếng nói bênh vực và ca ngợi vẻ đẹp, phẩm chất của người phụ nữ.", category: "trung-dai" },
    { title: "Nhàn", author: "Nguyễn Bỉnh Khiêm", genre: "Đường luật", era: "Nhà Mạc", script: "Chữ Nôm", desc: "Vẻ đẹp thanh cao, tâm thế nhàn dật của kẻ sĩ trước thời cuộc.", category: "trung-dai" },

    // --- VĂN HỌC HIỆN ĐẠI ---
    { title: "Chí Phèo", author: "Nam Cao", genre: "Truyện ngắn", era: "1941", script: "Quốc ngữ", desc: "Bi kịch của người nông dân bị tha hóa bởi xã hội phong kiến nửa thực dân.", category: "hien-dai" },
    { title: "Số Đỏ", author: "Vũ Trọng Phụng", genre: "Tiểu thuyết", era: "1936", script: "Quốc ngữ", desc: "Bức tranh trào phúng sâu sắc về xã hội tư sản thành thị những năm 1930.", category: "hien-dai" },
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

// 2. DỮ LIỆU ĐẠI BÁCH KHOA (BẢN FULL HỌC THUẬT CHI TIẾT)
const ENCYCLOPEDIA_DATA = [
    {
        title: "Quyển 0. Tâm Thư – Tuyên Ngôn Nền Tảng",
        content: `
            <h4>0.1. Tuyên ngôn về sự học và sáng tạo</h4>
            <p>Người làm thơ không chỉ là người có cảm xúc, mà là người có năng lực quan sát, suy tưởng, liên tưởng, thẩm mỹ và chuyển hóa tri thức thành nghệ thuật. Học rộng để mở rộng biên độ sáng tạo, học sâu để làm chủ tri thức.</p>
            <blockquote style="border-left: 3px solid var(--accent); padding-left: 15px; font-style: italic; margin: 15px 0; color: var(--text-dark);">
                "Tri thức giúp câu thơ có chiều sâu; cảm xúc giúp câu thơ có linh hồn; sự tiết chế giúp câu thơ sống lâu trong lòng người đọc. Đừng biến kho điển tích thành nơi phô diễn kiến thức. Một ánh trăng đúng chỗ đôi khi có sức gợi hơn mười điển cố được đặt cạnh nhau."
            </blockquote>
            
            <h4>0.2. Năm năng lực cốt lõi của người sáng tác</h4>
            <ul>
                <li><b>Năng lực quan sát:</b> Nhìn thấy những chi tiết, sắc thái và biến chuyển mà người khác dễ bỏ qua (ví dụ: nhìn thấy sự chuyển mình của chiếc lá, nghe được tiếng thở dài của mùa thu).</li>
                <li><b>Năng lực cảm thụ:</b> Nhận biết vẻ đẹp, nỗi buồn, sự tinh tế và những rung động của con người, thiên nhiên, văn hóa.</li>
                <li><b>Năng lực tri thức:</b> Hiểu biết về lịch sử, văn học, triết học, tôn giáo, mỹ học và đời sống để làm nền tảng cho sự liên tưởng.</li>
                <li><b>Năng lực liên tưởng:</b> Kết nối những sự vật, hình tượng và hệ tư tưởng tưởng như xa cách (ví dụ: liên tưởng từ dòng sông đến sự trôi chảy của thời gian và lịch sử).</li>
                <li><b>Năng lực sáng tạo:</b> Biến những gì đã học và đã cảm nhận thành một thế giới nghệ thuật có dấu ấn riêng.</li>
            </ul>
            <h4>0.3. Nguyên lý cốt lõi</h4>
            <p>Tri thức và kỹ thuật chỉ là phương tiện. Cảm xúc mới là nguồn năng lượng của tác phẩm. Kỹ thuật giúp cảm xúc đạt đến hình thức biểu đạt tinh tế, tránh sự rườm rà và sáo rỗng.</p>
        `
    },
    {
        title: "Quyển I. Sáu Nguyên Tắc Học Thuật Cốt Lõi",
        content: `
            <p><em>Đây là bộ lọc bắt buộc trong mọi hoạt động đọc hiểu, phân tích và sáng tác để tránh sự ngụy biện và hiểu sai.</em></p>
            
            <h4>1.1. Phân định văn tự và bối cảnh văn học</h4>
            <p>Tuyệt đối không đồng nhất những tác phẩm có hình thức gần nhau nhưng thuộc những truyền thống văn học khác nhau. Việc sử dụng chung hệ thống thi luật (niêm, luật, vần, đối) không đồng nghĩa với việc chúng cùng một nền văn học.</p>
            <ul>
                <li><b>Văn học chữ Hán Việt Nam:</b> Viết bằng chữ Hán nhưng phản ánh tâm hồn, lịch sử Việt Nam. Ví dụ: <i>Nam quốc sơn hà</i> (Lý Thường Kiệt), <i>Bình Ngô đại cáo</i> (Nguyễn Trãi).</li>
                <li><b>Văn học chữ Nôm Việt Nam:</b> Viết bằng chữ Nôm. Ví dụ: <i>Truyện Kiều</i> (Nguyễn Du), <i>Qua Đèo Ngang</i> (Bà Huyện Thanh Quan).</li>
                <li><b>Thơ Đường Trung Hoa:</b> Viết bằng chữ Hán, tuân thủ luật Đường thi. Ví dụ: <i>Tĩnh Dạ Tứ</i> (Lý Bạch), <i>Đăng Cao</i> (Đỗ Phủ).</li>
                <li><b>Thơ Nôm Đường luật:</b> Viết bằng chữ Nôm nhưng tuân thủ nghiêm ngặt luật thơ Đường. Ví dụ: <i>Bánh trôi nước</i> (Hồ Xuân Hương), <i>Thu điếu</i> (Nguyễn Khuyến).</li>
            </ul>

            <h4>1.2. Phân biệt thể loại, thể thơ và luật thơ</h4>
            <p>Ba khái niệm này thường bị dùng lẫn lộn nhưng có ranh giới rõ ràng:</p>
            <ul>
                <li><b>Thể loại:</b> Phương thức tổ chức tác phẩm theo đặc điểm nội dung và hình thức lớn (Tự sự, Trữ tình, Kịch, Văn chính luận).</li>
                <li><b>Thể thơ:</b> Hình thức tổ chức dòng thơ, số câu, số tiếng (Lục bát, Song thất lục bát, Ngũ ngôn, Thất ngôn, Thơ tự do).</li>
                <li><b>Luật thơ:</b> Hệ thống quy tắc về thanh điệu (Bằng - Trắc), vần, niêm, đối và cách tổ chức âm luật. Ví dụ: <i>Luật Đường thi</i>.</li>
            </ul>

            <h4>1.3. Thận trọng khi sử dụng khái niệm phá cách</h4>
            <p>Một tác phẩm không tuân thủ quy tắc truyền thống chưa đương nhiên là một tác phẩm phá cách có chủ ý. Để xác định phá cách, cần xem xét:</p>
            <ol>
                <li>Quy tắc truyền thống đang vận dụng là gì?</li>
                <li>Mức độ sai lệch so với quy tắc đó ra sao?</li>
                <li>Tính nhất quán của sự biến đổi trong toàn bộ tác phẩm.</li>
                <li>Hiệu quả biểu đạt của sự sai lệch (nó có làm tăng giá trị nghệ thuật không?).</li>
            </ol>
            <p>Nếu chưa đủ căn cứ, nên dùng các cách diễn đạt trung tính như: <i>hình thức biến thể</i>, <i>cách tổ chức phóng khoáng</i>.</p>

            <h4>1.4. Tiết chế điển tích và điển cố</h4>
            <p>Điển tích, điển cố là chất liệu văn hóa có khả năng mở rộng chiều sâu biểu đạt. Khi sử dụng cần kiểm tra: Nguồn gốc -> Văn bản liên quan -> Ý nghĩa nguyên thủy -> Biến đổi nghĩa -> Sự phù hợp với nội dung tác phẩm. Một điển tích có giá trị khi nó tạo thêm chiều sâu cho hình tượng, chứ không chỉ chứng minh người viết có nhiều kiến thức.</p>

            <h4>1.5. Tôn trọng tính đa nghĩa của biểu tượng</h4>
            <p>Biểu tượng nghệ thuật không phải một công thức giải mã cố định. Ánh trăng có thể gợi: Nỗi nhớ quê hương, Tình cảm tri âm, Sự đoàn viên, Cô đơn và chia biệt, Vẻ đẹp thanh tao, Thời gian và sự vô thường, Tâm thức thiền định, Sự soi chiếu nội tâm. Ý nghĩa cụ thể phải được xác định từ văn cảnh, chủ thể trữ tình, truyền thống văn hóa và cấu trúc tác phẩm.</p>

            <h4>1.6. Phân biệt sự thật, giả thuyết và diễn giải</h4>
            <p>Mọi nhận định học thuật nên được phân thành bốn cấp: </p>
            <ul>
                <li><b>Dữ kiện:</b> Có căn cứ văn bản hoặc lịch sử xác thực (Ví dụ: <i>Bài thơ có 8 câu</i>).</li>
                <li><b>Giả thuyết:</b> Có khả năng đúng nhưng cần thêm chứng cứ (Ví dụ: <i>Tác giả viết bài này khi bị giam cầm</i>).</li>
                <li><b>Diễn giải:</b> Cách đọc dựa trên lập luận (Ví dụ: <i>Hình tượng ánh trăng tượng trưng cho sự cô đơn</i>).</li>
                <li><b>Cảm nhận:</b> Phản ứng thẩm mỹ chủ quan (Ví dụ: <i>Bài thơ này rất buồn</i>).</li>
            </ul>
            <p>Tuyệt đối không trình bày một liên tưởng cá nhân như một sự thật lịch sử.</p>
        `
    },
    {
        title: "Quyển II. Thi Pháp Học Và Mỹ Học",
        content: `
            <h4>2.1. Khái niệm thi pháp học</h4>
            <p>Thi pháp học nghiên cứu những nguyên tắc, phương thức và đặc điểm tổ chức nghệ thuật của tác phẩm văn học. Nó trả lời câu hỏi: Tác phẩm được tổ chức như thế nào? Hình tượng được xây dựng ra sao? Thời gian và không gian vận động thế nào?</p>
            
            <h4>2.2. Hệ thống bốn tầng phân tích</h4>
            <ul>
                <li><b>Tầng 1. Tính nhạc – Vẻ đẹp âm thanh:</b> Tiếng Việt có 6 thanh. Nhóm Bằng (ngang, huyền) tạo âm điệu bằng phẳng, kéo dài. Nhóm Trắc (sắc, hỏi, ngã, nặng) tạo âm điệu gấp khúc, dứt khoát. Sự phối hợp Bằng - Trắc tạo nên nhạc điệu cho thơ. Vần (chân, lưng, liền, cách) tạo sự kết dính và ngân vang.</li>
                <li><b>Tầng 2. Điệu thơ – Nhịp vận động cảm xúc:</b> Sắc điệu có thể là Trang trọng (thơ chính luận), Trữ tình (thơ tình), U hoài (thơ cổ), Bi tráng (thơ kháng chiến), Hào sảng. Một bài thơ có thể chuyển điệu trong quá trình phát triển.</li>
                <li><b>Tầng 3. Thần thái – Khí chất nghệ thuật:</b> Khí chất toát ra từ toàn bộ tác phẩm: Cổ phong (cổ điển), Thanh tân (tươi mới), Thanh nhã (cao sang), Phóng khoáng, Dân gian.</li>
                <li><b>Tầng 4. Hồn thơ – Sức sống tinh thần:</b> Sự hòa quyện của Tình (cảm xúc), Ý (tư tưởng), Cảnh (hình tượng), Điệu (nhịp điệu), Thần (khí chất).</li>
            </ul>
            
            <h4>2.3. Các cặp phạm trù thi pháp</h4>
            <ul>
                <li><b>Tĩnh và Động:</b> Dĩ động tả tĩnh (Dùng chuyển động nhỏ để làm nổi bật sự tĩnh lặng). Ví dụ: Tiếng chim kêu làm nổi bật sự tĩnh mịch của núi rừng.</li>
                <li><b>Không gian nghệ thuật:</b> Không gian thực (làng quê, chiến trận), không gian tâm tưởng (giấc mơ, hoài niệm).</li>
                <li><b>Thời gian nghệ thuật:</b> Thời gian tuyến tính (quá khứ - hiện tại - tương lai), thời gian tuần hoàn (sự chuyển mùa), thời gian đồng hiện (ký ức ùa về cùng hiện tại).</li>
                <li><b>Hàm súc và ý tại ngôn ngoại:</b> Chứa đựng nhiều ý nghĩa trong ngôn từ cô đọng, ý vượt ra ngoài lớp nghĩa trực tiếp (Nói một nhưng gợi mười).</li>
                <li><b>Thi trung hữu họa / Thi trung hữu nhạc:</b> Thơ có khả năng tạo ra hình ảnh như hội họa (nên đọc bằng thị giác) và âm hưởng như âm nhạc (nên đọc bằng thính giác).</li>
            </ul>
        `
    },
    {
        title: "Quyển III. Chuyên Đề Tam Giáo – Nho, Đạo, Phật",
        content: `
            <h4>3.1. Nguyên tắc nghiên cứu</h4>
            <p>Không đóng khung Nho là nhập thế, Đạo là xuất thế, Phật là giải thoát như ba định nghĩa tuyệt đối. Ba truyền thống có quá trình giao thoa phức tạp. Cần phân biệt sự tương đồng, ảnh hưởng, tiếp nhận và dung hợp.</p>

            <h4>3.2. Nho gia – Đạo lý để bước vào đời</h4>
            <ul>
                <li><b>Cốt lõi:</b> Ngũ thường (Nhân, Nghĩa, Lễ, Trí, Tín). Chuỗi Cách vật - Trí tri - Thành ý - Chính tâm - Tu thân - Tề gia - Trị quốc - Bình thiên hạ.</li>
                <li><b>Lưu ý:</b> Tam cương là hệ chuẩn mực lịch sử phong kiến, không phải đạo đức phổ quát. Không đồng nhất công danh với danh vọng cá nhân.</li>
                <li><b>Biểu hiện văn học:</b> Lý tưởng quân tử, chí hướng lập thân, trách nhiệm với quốc gia, tôn sư trọng đạo, tư tưởng nhân nghĩa.</li>
            </ul>

            <h4>3.3. Đạo gia – Tâm thế để đi qua đời</h4>
            <ul>
                <li><b>Phân định:</b> Đạo gia (Triết học Lão Trang: Đạo, Vô vi, Tự nhiên, Tiêu dao, Tề vật) khác với Đạo giáo (Tôn giáo có nghi lễ, tổ chức).</li>
                <li><b>Lưu ý:</b> "Thượng thiện nhược thủy" (Đạo Đức Kinh, chương 8). Không phải cứ viết về núi rừng, ẩn dật là chịu ảnh hưởng trực tiếp của Đạo gia. Cần căn cứ từ tư tưởng và văn bản.</li>
                <li><b>Biểu hiện văn học:</b> Tâm thế nhàn dật, hòa hợp thiên nhiên, chất vấn danh lợi, cảm hứng tiêu dao (ví dụ: thơ Nguyễn Bỉnh Khiêm).</li>
            </ul>

            <h4>3.4. Phật giáo – Chiêm nghiệm, từ bi và giải thoát</h4>
            <ul>
                <li><b>Cốt lõi:</b> Tứ diệu đế (Khổ, Tập, Diệt, Đạo), Duyên khởi, Vô thường, Vô ngã, Nghiệp, Từ bi, Bát chính đạo.</li>
                <li><b>Lưu ý:</b> Không đồng nhất vô thường với bi quan, nghiệp với số phận định sẵn. Không đồng nhất "Tài mệnh tương đố" với giáo lý Phật giáo.</li>
                <li><b>Biểu hiện văn học:</b> Cảm thức vô thường, suy tư sinh tử, lòng từ bi, tinh thần buông bỏ, khát vọng giải thoát.</li>
            </ul>

            <h4>3.5. Sự giao thoa Tam giáo</h4>
            <p>Trong lịch sử văn học Việt Nam và Đông Á, Nho – Đạo – Phật nhiều lần cùng tồn tại, tiếp xúc và dung hợp. Cần phân biệt: Cùng tồn tại -> Ảnh hưởng qua lại -> Tiếp nhận có chọn lọc -> Dung thông tư tưởng. Không hiểu "Tam giáo đồng nguyên" theo nghĩa ba truyền thống hoàn toàn giống nhau hoặc có chung một nguồn gốc lịch sử.</p>
        `
    },
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
            <h4>4.2. Phân định các tác phẩm tiêu biểu (Tránh nhầm lẫn)</h4>
            <ul>
                <li><b>Nam quốc sơn hà:</b> Thơ chữ Hán (thất ngôn tứ tuyệt).</li>
                <li><b>Bình Ngô đại cáo:</b> Văn chính luận, thể cáo, chữ Hán.</li>
                <li><b>Truyện Kiều:</b> Truyện thơ Nôm, thể lục bát.</li>
                <li><b>Chinh phụ ngâm:</b> Ngâm khúc, bản diễn Nôm nổi tiếng dùng thể song thất lục bát.</li>
                <li><b>Qua Đèo Ngang / Câu cá mùa thu:</b> Thơ Nôm Đường luật.</li>
                <li><b>Tây Tiến:</b> Thơ kháng chiến chống Pháp (Không xếp vào Thơ Mới).</li>
                <li><b>Việt Bắc:</b> Thơ trữ tình chính trị, thể lục bát.</li>
                <li><b>Đồng chí:</b> Thơ kháng chiến, thể thơ tự do có tổ chức nhịp điệu riêng.</li>
            </ul>
            <h4>4.3. Văn học Việt Nam và Thế giới</h4>
            <ul>
                <li><b>Việt Nam:</b> Văn học dân gian (truyền miệng, tập thể, dị bản); Văn học trung đại (yêu nước, nhân nghĩa, Nho - Phật, chữ Hán/Nôm); Văn học hiện đại (Thơ Mới, Hiện thực, Cách mạng, Đổi mới).</li>
                <li><b>Trung Hoa:</b> Kinh Thi (tập thơ cổ), Sở Từ (Khuất Nguyên), Thơ Đường (Lý Bạch - phóng khoáng, kỳ ảo; Đỗ Phủ - hiện thực, nhân đạo).</li>
                <li><b>Thế giới:</b> Sử thi Gilgamesh (Lưỡng Hà), Kinh Veda & Mahabharata, Ramayana (Ấn Độ), Iliad, Odyssey (Hy Lạp), Thần khúc (Dante), Hamlet (Shakespeare).</li>
            </ul>
        `
    },
    {
        title: "Quyển V. Từ Điển Biểu Tượng Và Ngôn Ngữ Nghệ Thuật",
        content: `
            <h4>5.1. Biểu tượng trong văn học</h4>
            <p>Là hình ảnh mang ý nghĩa vượt ra ngoài sự vật trực tiếp. Một biểu tượng có thể có: Nghĩa tả thực, nghĩa văn hóa, lịch sử, tâm lý, triết học và nghĩa riêng trong tác phẩm. Không có biểu tượng nào chỉ có duy nhất một nghĩa.</p>
            <h4>5.2. Hệ thống biểu tượng Á Đông</h4>
            <ul>
                <li><b>Tứ quý:</b> Tùng (bền bỉ, khí tiết), Cúc (thanh cao, nhàn dật), Trúc (ngay thẳng, thanh nhã), Mai (sức sống, thanh khiết).</li>
                <li><b>Khác:</b> Trăng (đoàn viên, nhớ, cô đơn, chiêm nghiệm), Liễu (chia biệt), Đào (tuổi trẻ, mùa xuân), Sen (thanh khiết), Hạc (thanh cao, trường thọ), Nhạn (tin tức), Mây (phiêu du), Nước (thời gian, mềm mại), Thuyền (hành trình), Bến đò (gặp gỡ, chia tay).</li>
            </ul>
            <h4>5.3. Từ điển Hán Việt trong thi ca (Hiệu đính học thuật)</h4>
            <ul>
                <li><b>Vọng (望):</b> Nghĩa chính là trông về, ngóng đợi, hướng đến. Không mặc nhiên đồng nghĩa với âm thanh vọng lại. (Trong nhan đề gợi hướng nhìn về quá khứ, nỗi mong đợi).</li>
                <li><b>Khúc (曲):</b> Nghĩa là khúc nhạc, bản nhạc, đoạn, phần. Không mặc nhiên mang nghĩa chặng đường.</li>
                <li><b>Trường (長 / 場):</b> Cần phân biệt. Trường trong "dặm trường" (長) là dài. Trường trong "mái trường" (場/學校) là nơi học tập. Sự đồng âm tạo liên tưởng nhưng không được đánh tráo khái niệm.</li>
                <li><b>Mai (梅 / 明日):</b> Hoa mai và ngày mai là hai chữ khác nhau, không ghép thành quy luật chuyển hóa biểu tượng khi chưa có cơ sở văn bản.</li>
            </ul>
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
    {
        title: "Quyển VI. Thực Hành Phân Tích – Vọng Khúc Thanh Xuân",
        content: `
            <h4>6.1. Văn bản gốc</h4>
            <blockquote style="border-left: 3px solid var(--accent); padding-left: 15px; font-style: italic; margin: 15px 0; color: var(--text-dark); line-height: 2;">
                Quạt giấy khép lại mùa thi,<br>
                Áo dài bay giữa kinh kỳ sắc xuân.<br>
                Thầy cô tựa ánh trăng ngần,<br>
                Dắt em qua những thăng trầm thế gian.<br>
                Lời ru thuở trước vọng vang,<br>
                Điển xưa tích cũ, hành trang em mang.<br>
                Nón nghiêng che nắng đường làng,<br>
                Mai này xa, vẫn ngỡ ngàng nhớ ơn.<br>
                Dẫu đi muôn nẻo dặm trường,<br>
                Cội nguồn văn hóa, tình thương thầy cô.
            </blockquote>
            <h4>6.2. Phân tích nhan đề</h4>
            <ul>
                <li><b>Vọng:</b> Hướng về, trông ngóng, hoài niệm.</li>
                <li><b>Khúc:</b> Gợi chỉnh thể âm nhạc, khúc ca.</li>
                <li><b>Thanh xuân:</b> Độ tuổi, miền ký ức, khát vọng.</li>
            </ul>
            <h4>6.3. Phân tích hình thức</h4>
            <p>Bài thơ có 10 dòng, luân phiên 6 và 8 tiếng. Gọi chính xác là hình thức sáu-tám, gần với lục bát. Cần kiểm tra hệ thống vần trước khi kết luận là lục bát chuẩn hay biến thể. Không tự động gọi chỗ chưa đúng luật là phá cách.</p>
            <h4>6.4. Hệ thống hình tượng</h4>
            <p>Quạt giấy (văn hóa, khép lại), Áo dài (vẻ đẹp tuổi trẻ), Ánh trăng (người thầy soi sáng, thanh khiết), Lời ru (cội nguồn dân gian), Điển xưa (tri thức truyền thống), Nón nghiêng/đường làng (không gian làng quê, bình dị).</p>
            <h4>6.5. Phân tích 4 tầng nghệ thuật</h4>
            <ul>
                <li><b>Tính nhạc:</b> Luân phiên 6-8, vần, thanh bằng trắc, nhịp thơ, tổ hợp âm thanh ("vọng vang", "dặm trường").</li>
                <li><b>Điệu thơ:</b> Chuyển động từ trong trẻo (mở đầu) -> trang trọng, hoài niệm (giữa) -> lắng đọng, tri ân (cuối).</li>
                <li><b>Thần thái:</b> Thanh tân, Cổ phong, Trữ tình, Dân tộc, Hoài niệm.</li>
                <li><b>Hồn thơ:</b> Tình (biết ơn, lưu luyến), Ý (kế thừa tri thức), Cảnh (mái trường, ánh trăng), Điệu (mềm mại), Thần (trang nhã, tình nghĩa).</li>
            </ul>
            <h4>6.6. Dưới lăng kính Nho gia</h4>
            <p>Tình thầy trò, Tôn sư trọng đạo, Kế thừa truyền thống, Trách nhiệm. "Điển xưa tích cũ" là tiếp nhận di sản. "Dặm trường" là bước vào đời. "Cội nguồn văn hóa" là ý thức gìn giữ.</p>
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
            <h4>7.2. Quy trình sáng tác (7 giai đoạn)</h4>
            <ol>
                <li>Tìm hạt nhân cảm xúc (Con người, kỷ niệm, tư tưởng...).</li>
                <li>Mở rộng chân trời liên tưởng (Văn hóa, lịch sử, triết học...).</li>
                <li>Xây dựng hệ thống hình tượng (Không gian, màu sắc, âm thanh).</li>
                <li>Xác định điệu và tính nhạc (Nhịp điệu, âm hưởng).</li>
                <li>Viết và chuyển hóa tri thức (Chọn lọc chất liệu tinh túy).</li>
                <li>Hiệu đính (Từ ngữ, vần nhịp, cấu trúc).</li>
                <li>Đọc lại bằng nhiều góc nhìn (Người đọc, nhà nghiên cứu...).</li>
            </ol>
            <h4>7.3. Các lĩnh vực mở rộng tương lai</h4>
            <p>Lý luận văn học đại cương, Tự sự học, Văn bản học, Thư mục học, Âm vận học, Lịch sử tư tưởng, Mỹ học so sánh Đông - Tây, Phê bình văn học, Phong cách học, Văn hóa học.</p>
            <h4>7.4. Nguồn tri thức ưu tiên</h4>
            <ol>
                <li>Văn bản gốc và bản dịch có chú giải.</li>
                <li>Từ điển chuyên ngành và công trình khảo cứu.</li>
                <li>Giáo trình đại học và sách nghiên cứu.</li>
                <li>Bài báo khoa học có phản biện.</li>
                <li>Tài liệu phổ thông có nguồn trích dẫn rõ ràng.</li>
                <li>Diễn giải cá nhân/tư liệu mạng cần đối chiếu.</li>
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