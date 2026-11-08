/* =====================================================================
   VĂN ĐẠO ENGINE - MASTER DATA (ULTIMATE V10)
   Tác giả: Văn Đạo
   Mô tả: Trái tim tri thức của hệ thống, đã fix toàn bộ lỗi học thuật.
   Cấu trúc: 
   - Phần 1: HERITAGE_DATA (50+ Tác phẩm Văn học)
   - Phần 2: ENCYCLOPEDIA_DATA (8 Quyển Đại Bách Khoa)
   - Phần 3: QUOTES_DATA & MARQUEE_KEYWORDS
   ===================================================================== */

/* =====================================================================
   PHẦN 1: DỮ LIỆU VĂN HIẾN (HERITAGE DATA)
   Phân loại: Dân gian, Trung đại, Hiện đại, Thế giới, Ca dao, Điển tích.
   ===================================================================== */
const HERITAGE_DATA = [
    
    // --- NHÓM 1: VĂN HỌC DÂN GIAN (Truyền miệng) ---
    { title: "Con Rồng Cháu Tiên", author: "Dân gian", genre: "Truyền thuyết", era: "Thời Hồng Bàng", script: "Truyền miệng", desc: "Giải thích nguồn gốc cao quý của dân tộc Việt Nam, phản ánh ý thức cộng đồng.", category: "dan-gian" },
    { title: "Sơn Tinh Thủy Tinh", author: "Dân gian", genre: "Truyền thuyết", era: "Thời Hùng Vương", script: "Truyền miệng", desc: "Ca ngợi công cuộc trị thủy và bảo vệ đất nước của cha ông ta.", category: "dan-gian" },
    { title: "Tấm Cám", author: "Dân gian", genre: "Cổ tích", era: "Không rõ", script: "Truyền miệng", desc: "Hành trình đấu tranh giành hạnh phúc của cô Tấm, thể hiện khát vọng công lý.", category: "dan-gian" },
    { title: "Thạch Sanh", author: "Dân gian", genre: "Cổ tích", era: "Không rõ", script: "Truyền miệng", desc: "Người hùng diệt chằn tinh, đại bàng và đánh đuổi giặc ngoại xâm.", category: "dan-gian" },
    { title: "Thánh Gióng", author: "Dân gian", genre: "Truyền thuyết", era: "Thời Hùng Vương", script: "Truyền miệng", desc: "Ca ngợi tinh thần yêu nước, chống giặc ngoại xâm của người anh hùng nhỏ tuổi.", category: "dan-gian" },
    { title: "Truyện Trê Cóc", author: "Khuyết danh", genre: "Truyện thơ Nôm", era: "TK 18", script: "Chữ Nôm", desc: "Tác phẩm trào phúng sâu sắc về xã hội phong kiến đầy bất công (Lưu ý: Là văn bản viết, không phải truyền miệng).", category: "trung-dai" },

    // --- NHÓM 2: VĂN HỌC TRUNG ĐẠI (Chữ Hán & Chữ Nôm) ---
    { title: "Nam quốc sơn hà", author: "Lý Thường Kiệt", genre: "Thất ngôn tứ tuyệt", era: "Nhà Lý", script: "Chữ Hán", desc: "Bản tuyên ngôn độc lập đầu tiên, khẳng định chủ quyền lãnh thổ.", category: "trung-dai" },
    { title: "Hịch tướng sĩ", author: "Trần Quốc Tuấn", genre: "Hịch", era: "Nhà Trần", script: "Chữ Hán", desc: "Lời kêu gọi tinh thần yêu nước, quyết chiến chống quân Nguyên Mông.", category: "trung-dai" },
    { title: "Phò giá về kinh", author: "Trần Quang Khải", genre: "Ngũ ngôn tứ tuyệt", era: "Nhà Trần", script: "Chữ Hán", desc: "Hào khí chiến thắng và khát vọng thái bình thịnh trị của dân tộc.", category: "trung-dai" },
    { title: "Phú sông Bạch Đằng", author: "Trương Hán Siêu", genre: "Phú", era: "Nhà Trần", script: "Chữ Hán", desc: "Hoài niệm chiến công lịch sử, ca ngợi truyền thống yêu nước.", category: "trung-dai" },
    { title: "Bình Ngô Đại Cáo", author: "Nguyễn Trãi", genre: "Cáo", era: "Nhà Lê sơ", script: "Chữ Hán", desc: "Áng văn chính luận mẫu mực, tuyên bố chiến thắng quân Minh và khẳng định nền độc lập.", category: "trung-dai" },
    { title: "Truyện Kiều", author: "Nguyễn Du", genre: "Lục bát", era: "Triều Nguyễn", script: "Chữ Nôm", desc: "Tác phẩm kiệt xuất nhất của văn học trung đại Việt Nam, kể về cuộc đời gian truân của Thúy Kiều.", category: "trung-dai" },
    { title: "Chinh Phụ Ngâm (Bản Nôm)", author: "Đoàn Thị Điểm (dịch)", genre: "Song thất lục bát", era: "TK 18", script: "Chữ Nôm", desc: "Bản diễn Nôm nổi tiếng từ nguyên tác chữ Hán của Đặng Trần Côn, khúc ngâm về nỗi sầu muộn của người vợ chờ chồng.", category: "trung-dai" },
    { title: "Qua Đèo Ngang", author: "Bà Huyện Thanh Quan", genre: "Đường luật", era: "Triều Nguyễn", script: "Chữ Nôm", desc: "Bức tranh thiên nhiên và tâm trạng hoài cổ, cô đơn của tác giả khi dừng chân trên đèo.", category: "trung-dai" },
    { title: "Câu cá mùa thu", author: "Nguyễn Khuyến", genre: "Thất ngôn bát cú Đường luật", era: "Cuối TK 19", script: "Chữ Nôm", desc: "Bức tranh mùa thu thanh tĩnh ở làng quê, ẩn chứa tâm sự yêu nước thầm kín.", category: "trung-dai" },
    { title: "Bánh Trôi Nước", author: "Hồ Xuân Hương", genre: "Thất ngôn tứ tuyệt", era: "Cuối Lê - Đầu Nguyễn", script: "Chữ Nôm", desc: "Tiếng nói bênh vực và ca ngợi vẻ đẹp, phẩm chất của người phụ nữ.", category: "trung-dai" },
    { title: "Nhàn", author: "Nguyễn Bỉnh Khiêm", genre: "Đường luật", era: "Nhà Mạc", script: "Chữ Nôm", desc: "Vẻ đẹp thanh cao, tâm thế nhàn dật của kẻ sĩ trước thời cuộc.", category: "trung-dai" },
    { title: "Lục Vân Tiên", author: "Nguyễn Đình Chiểu", genre: "Truyện thơ Nôm", era: "TK 19", script: "Chữ Nôm", desc: "Truyện thơ ca ngợi tinh thần nghĩa hiệp, đạo lý làm người.", category: "trung-dai" },
    { title: "Văn tế nghĩa sĩ Cần Giuộc", author: "Nguyễn Đình Chiểu", genre: "Văn tế", era: "TK 19", script: "Chữ Nôm", desc: "Tiếng khóc bi tráng cho những người nông dân nghĩa sĩ hy sinh vì nước.", category: "trung-dai" },

    // --- NHÓM 3: VĂN HỌC HIỆN ĐẠI (Thế kỷ 20) ---
    { title: "Chí Phèo", author: "Nam Cao", genre: "Truyện ngắn", era: "1941", script: "Quốc ngữ", desc: "Bi kịch của người nông dân bị tha hóa bởi xã hội phong kiến nửa thực dân.", category: "hien-dai" },
    { title: "Lão Hạc", author: "Nam Cao", genre: "Truyện ngắn", era: "1943", script: "Quốc ngữ", desc: "Số phận bi thảm của người nông dân nghèo nhưng giàu lòng tự trọng.", category: "hien-dai" },
    { title: "Tắt Đèn", author: "Ngô Tất Tố", genre: "Tiểu thuyết", era: "1939", script: "Quốc ngữ", desc: "Bức tranh hiện thực về nạn sưu thuế và nỗi khổ của người nông dân.", category: "hien-dai" },
    { title: "Số Đỏ", author: "Vũ Trọng Phụng", genre: "Tiểu thuyết", era: "1936", script: "Quốc ngữ", desc: "Bức tranh trào phúng sâu sắc về xã hội tư sản thành thị những năm 1930.", category: "hien-dai" },
    { title: "Vội Vàng", author: "Xuân Diệu", genre: "Thơ tự do (Thất ngôn biến thể)", era: "Thơ Mới (1938)", script: "Quốc ngữ", desc: "Khát vọng sống mãnh liệt, cuồng nhiệt trước vẻ đẹp cuộc đời.", category: "hien-dai" },
    { title: "Đây Thôn Vĩ Dạ", author: "Hàn Mặc Tử", genre: "Thất ngôn bát cú", era: "Thơ Mới (1938)", script: "Quốc ngữ", desc: "Bức tranh xứ Huế mộng mơ và nỗi niềm thi sĩ.", category: "hien-dai" },
    { title: "Tràng Giang", author: "Huy Cận", genre: "Thất ngôn bát cú", era: "Thơ Mới (1939)", script: "Quốc ngữ", desc: "Nỗi sầu vũ trụ, vẻ đẹp cổ điển và hiện đại của sông nước mênh mang.", category: "hien-dai" },
    { title: "Tây Tiến", author: "Quang Dũng", genre: "Thơ tự do (Thất ngôn biến thể)", era: "Kháng chiến Pháp", script: "Quốc ngữ", desc: "Bài thơ lãng mạn, bi tráng về người lính và núi rừng Tây Bắc.", category: "hien-dai" },
    { title: "Đồng Chí", author: "Chính Hữu", genre: "Thơ tự do", era: "Kháng chiến Pháp", script: "Quốc ngữ", desc: "Tình đồng đội thiêng liêng, gắn bó keo sơn nơi chiến hào.", category: "hien-dai" },
    { title: "Nhật Ký Trong Tù", author: "Hồ Chí Minh", genre: "Thất ngôn tứ tuyệt", era: "1942-1943", script: "Chữ Hán", desc: "Tinh thần lạc quan, ý chí kiên cường của người tù cách mạng.", category: "hien-dai" },
    { title: "Việt Bắc", author: "Tố Hữu", genre: "Lục bát", era: "Kháng chiến Pháp", script: "Quốc ngữ", desc: "Khúc tình ca về cách mạng, kháng chiến và con người kháng chiến.", category: "hien-dai" },
    { title: "Bài thơ về tiểu đội xe không kính", author: "Phạm Tiến Duật", genre: "Thơ tự do", era: "Kháng chiến Mỹ", script: "Quốc ngữ", desc: "Hình ảnh người lính lái xe Trường Sơn lạc quan, dũng cảm.", category: "hien-dai" },
    { title: "Đoàn thuyền đánh cá", author: "Huy Cận", genre: "Thất ngôn trường thiên", era: "1958", script: "Quốc ngữ", desc: "Vẻ đẹp tráng lệ của biển cả và người lao động mới.", category: "hien-dai" },
    { title: "Mùa xuân nho nhỏ", author: "Thanh Hải", genre: "Thơ 5 chữ", era: "1980", script: "Quốc ngữ", desc: "Ước nguyện chân thành được cống hiến cho đất nước.", category: "hien-dai" },

    // --- NHÓM 4: VĂN HỌC THẾ GIỚI ---
    { title: "Tĩnh Dạ Tứ", author: "Lý Bạch", genre: "Ngũ ngôn tứ tuyệt", era: "Thịnh Đường", script: "Chữ Hán", desc: "Nỗi nhớ quê hương da diết của thi tiên Lý Bạch.", category: "the-gioi" },
    { title: "Đăng Cao", author: "Đỗ Phủ", genre: "Thất ngôn bát cú", era: "Thịnh Đường", script: "Chữ Hán", desc: "Nỗi buồn thời cuộc, thân phận con người trước thiên nhiên rộng lớn.", category: "the-gioi" },
    { title: "Thần Khúc", author: "Dante", genre: "Trường ca", era: "Thời Phục Hưng", script: "Tiếng Ý", desc: "Hành trình qua Địa ngục, Luyện ngục và Thiên đường.", category: "the-gioi" },
    { title: "Hamlet", author: "Shakespeare", genre: "Bi kịch", era: "TK 16-17", script: "Tiếng Anh", desc: "Vở kịch kinh điển về sự trả thù và những trăn trở triết học.", category: "the-gioi" },
    { title: "Hoàng Tử Bé", author: "Antoine de Saint-Exupéry", genre: "Tiểu thuyết", era: "1943", script: "Tiếng Pháp", desc: "Câu chuyện triết lý sâu sắc dành cho cả người lớn và trẻ em.", category: "the-gioi" },
    { title: "Chiến tranh và Hòa bình", author: "Lev Tolstoy", genre: "Tiểu thuyết sử thi", era: "1869", script: "Tiếng Nga", desc: "Bức tranh hoành tráng về xã hội Nga trong cuộc chiến tranh Napoleon.", category: "the-gioi" },

    // --- NHÓM 5: CA DAO - TỤC NGỮ ---
    { title: "Tục ngữ về thiên nhiên", author: "Dân gian", genre: "Tục ngữ", era: "Truyền miệng", script: "Quốc ngữ", desc: "Kinh nghiệm dự báo thời tiết, quan sát tự nhiên (VD: 'Chuồn chuồn bay thấp...').", category: "ca-dao" },
    { title: "Tục ngữ về đạo lý", author: "Dân gian", genre: "Tục ngữ", era: "Truyền miệng", script: "Quốc ngữ", desc: "Bài học ứng xử, triết lý sống (VD: 'Uống nước nhớ nguồn').", category: "ca-dao" },
    { title: "Ca dao than thân", author: "Dân gian", genre: "Ca dao", era: "Truyền miệng", script: "Quốc ngữ", desc: "Tiếng nói phản kháng, than thở về số phận bất hạnh (VD: 'Thân em như tấm lụa đào...').", category: "ca-dao" },
    { title: "Ca dao yêu thương tình nghĩa", author: "Dân gian", genre: "Ca dao", era: "Truyền miệng", script: "Quốc ngữ", desc: "Tình cảm gia đình, tình yêu đôi lứa, tình bạn.", category: "ca-dao" },
    { title: "Ca dao hài hước", author: "Dân gian", genre: "Ca dao", era: "Truyền miệng", script: "Quốc ngữ", desc: "Tiếng cười tự trào, phê phán thói hư tật xấu.", category: "ca-dao" },

    // --- NHÓM 6: ĐIỂN TÍCH - ĐIỂN CỐ (Đã Fix Lỗi Học Thuật) ---
    { title: "Sân Lai", author: "Điển cố Trung Hoa", genre: "Điển cố", era: "Thời Xuân Thu", script: "Chữ Hán", desc: "Lão Lai Tử mặc áo trẻ con để mua vui cho cha mẹ. Chỉ lòng hiếu thảo.", category: "dien-tich" },
    { title: "Ngưu Lang - Chức Nữ", author: "Điển tích Trung Hoa", genre: "Điển tích", era: "Truyền thuyết", script: "Chữ Hán", desc: "Biểu tượng của tình yêu đôi lứa bị ngăn cách, gặp nhau ngày Thất tịch.", category: "dien-tich" },
    { title: "Gót sen ba tấc", author: "Điển cố Trung Hoa", genre: "Điển cố", era: "Thời Nam Tề", script: "Chữ Hán", desc: "Chỉ đôi chân nhỏ của người phụ nữ thời phong kiến (tục bó chân).", category: "dien-tich" },
    { title: "Làn thu thủy, nét xuân sơn", author: "Nguyễn Du", genre: "Điển tích", era: "Truyện Kiều", script: "Chữ Nôm", desc: "Tả vẻ đẹp sắc sảo, đoan trang của Thúy Kiều (mắt trong như nước mùa thu, lông mày đẹp như núi mùa xuân).", category: "dien-tich" },
    { title: "Khuôn trăng đầy đặn, nét ngài nở nang", author: "Nguyễn Du", genre: "Điển tích", era: "Truyện Kiều", script: "Chữ Nôm", desc: "Tả vẻ đẹp phúc hậu, đoan trang của Thúy Vân.", category: "dien-tich" },
    { title: "Bèo dạt mây trôi", author: "Điển tích Việt Nam", genre: "Thành ngữ", era: "Dân gian", script: "Quốc ngữ", desc: "Chỉ thân phận trôi nổi, vô định, không biết đi về đâu.", category: "dien-tich" },
    { title: "Chim lồng cá chậu", author: "Điển tích Việt Nam", genre: "Điển cố", era: "Dân gian", script: "Quốc ngữ", desc: "Chỉ hoàn cảnh bị giam hãm, mất tự do, không thể phát triển.", category: "dien-tich" }
];


/* =====================================================================
   PHẦN 2: DỮ LIỆU ĐẠI BÁCH KHOA (ENCYCLOPEDIA DATA)
   Định dạng: HTML (để hiển thị đẹp trong thẻ details/summary).
   ===================================================================== */
const ENCYCLOPEDIA_DATA = [
    {
        title: "Quyển 0. Tâm Thư – Tuyên Ngôn Nền Tảng",
        content: `
            <h4>0.1. Tuyên ngôn học tập và sáng tạo</h4>
            <p>"Học rộng để có nhiều chân trời, học sâu để thấu bản chất, cảm thụ tinh tế để nhận ra vẻ đẹp, sáng tạo độc lập để hình thành phong cách."</p>
            <p>"Điều đáng quý nhất ở một thi nhân không phải là họ nhìn thấy bao nhiêu điều trong một ánh trăng, mà là họ có thể khiến người đọc nhìn thấy một ánh trăng chưa từng được cảm nhận theo cách ấy."</p>
            <p>"Tri thức giúp câu thơ có chiều sâu; cảm xúc giúp câu thơ có linh hồn; sự tiết chế giúp câu thơ sống lâu trong lòng người đọc. Đừng biến kho điển tích thành nơi phô diễn kiến thức. Một ánh trăng đúng chỗ đôi khi có sức gợi hơn mười điển cố được đặt cạnh nhau."</p>
            <p>"Nho gia là đạo lý để bước vào đời; Đạo gia là một tâm thế để đi qua đời."</p>

            <h4>0.2. Quan niệm về người sáng tác</h4>
            <p>Người làm thơ không chỉ là người có cảm xúc mà còn là người có năng lực quan sát, suy tưởng, liên tưởng, thẩm mỹ và chuyển hóa tri thức thành nghệ thuật. Năm năng lực cốt lõi cần phát triển:</p>
            <ol>
                <li><b>Năng lực quan sát:</b> Nhìn thấy những chi tiết, sắc thái và biến chuyển mà người khác dễ bỏ qua.</li>
                <li><b>Năng lực cảm thụ:</b> Nhận biết vẻ đẹp, nỗi buồn, sự tinh tế và những rung động của con người, thiên nhiên, văn hóa.</li>
                <li><b>Năng lực tri thức:</b> Hiểu biết về lịch sử, văn học, triết học, tôn giáo, mỹ học và đời sống.</li>
                <li><b>Năng lực liên tưởng:</b> Kết nối những sự vật, hình tượng và hệ tư tưởng tưởng như xa cách.</li>
                <li><b>Năng lực sáng tạo:</b> Biến những gì đã học và đã cảm nhận thành một thế giới nghệ thuật có dấu ấn riêng.</li>
            </ol>

            <h4>0.3. Nguyên lý sáng tạo</h4>
            <ul>
                <li>Học rộng để mở rộng biên độ sáng tạo. Học sâu để làm chủ tri thức.</li>
                <li>Đọc nhiều để hình thành khả năng đối chiếu.</li>
                <li>Cảm nhận tinh tế để nhận ra vẻ đẹp.</li>
                <li>Chọn lọc để tránh sự rườm rà.</li>
                <li>Sáng tạo độc lập để hình thành phong cách.</li>
                <li><b>Nguyên lý cốt lõi:</b> Tri thức là phương tiện mở rộng khả năng sáng tạo, không phải vật trang sức cho câu thơ. Cảm xúc là nguồn năng lượng của tác phẩm, còn kỹ thuật nghệ thuật là phương tiện giúp cảm xúc đạt đến hình thức biểu đạt tinh tế.</li>
            </ul>
        `
    },
    {
        title: "Quyển I. Sáu Nguyên Tắc Học Thuật Cốt Lõi",
        content: `
            <p><em>(Bộ lọc bắt buộc trong mọi hoạt động đọc hiểu, phân tích và sáng tác)</em></p>

            <h4>1.1. Phân định văn tự và bối cảnh văn học</h4>
            <p>Không đồng nhất những tác phẩm có hình thức gần nhau nhưng thuộc những truyền thống văn học khác nhau.</p>
            <ul>
                <li><b>Cần phân biệt:</b> Văn học chữ Hán của Việt Nam, Văn học chữ Nôm của Việt Nam, Văn học chữ Hán của Trung Hoa, Thơ Đường Trung Hoa, Thơ Nôm Đường luật Việt Nam.</li>
                <li><b>Ví dụ:</b> Nam quốc sơn hà (Thơ chữ Hán, thất ngôn tứ tuyệt); Qua Đèo Ngang (Thơ Nôm Đường luật - Bà Huyện Thanh Quan); Câu cá mùa thu (Thơ Nôm thất ngôn bát cú Đường luật - Nguyễn Khuyến).</li>
                <li>Cùng sử dụng niêm, luật, vần và đối không có nghĩa là các tác phẩm thuộc cùng một truyền thống văn học hoặc cùng một ngôn ngữ.</li>
            </ul>

            <h4>1.2. Phân biệt thể loại, thể thơ và luật thơ</h4>
            <ul>
                <li><b>Thể loại:</b> Phương thức tổ chức tác phẩm theo đặc điểm nội dung và hình thức lớn (Tự sự, Trữ tình, Kịch, Văn chính luận).</li>
                <li><b>Thể thơ:</b> Hình thức tổ chức dòng thơ và số tiếng, số câu (Lục bát, Song thất lục bát, Ngũ ngôn, Thất ngôn, Thơ tự do).</li>
                <li><b>Luật thơ:</b> Hệ thống quy tắc về thanh điệu, vần, niêm, đối và cách tổ chức âm luật (Luật bằng - trắc, phép đối Đường luật).</li>
                <li>Tuyệt đối không dùng ba khái niệm này thay thế cho nhau.</li>
            </ul>

            <h4>1.3. Thận trọng khi sử dụng khái niệm phá cách</h4>
            <p>Một tác phẩm không tuân thủ quy tắc truyền thống chưa đương nhiên là một tác phẩm phá cách có chủ ý. Để xác định phá cách, cần xem xét: Quy tắc truyền thống đang vận dụng -> Mức độ sai lệch -> Tính nhất quán của sự biến đổi -> Hiệu quả biểu đạt -> Bằng chứng từ cấu trúc và dụng ý nghệ thuật.</p>
            <p>Nếu chưa đủ căn cứ, nên dùng các cách diễn đạt trung tính như: hình thức biến thể, cách tổ chức phóng khoáng.</p>

            <h4>1.4. Tiết chế điển tích và điển cố</h4>
            <p>Điển tích, điển cố là chất liệu văn hóa có khả năng mở rộng chiều sâu biểu đạt. Khi sử dụng cần kiểm tra: Nguồn gốc -> Văn bản liên quan -> Ý nghĩa nguyên thủy -> Biến đổi nghĩa -> Sự phù hợp với nội dung tác phẩm.</p>
            <p>Một điển tích có giá trị khi nó tạo thêm chiều sâu cho hình tượng, chứ không chỉ chứng minh người viết có nhiều kiến thức.</p>

            <h4>1.5. Tôn trọng tính đa nghĩa của biểu tượng</h4>
            <p>Biểu tượng nghệ thuật không phải một công thức giải mã cố định. Ánh trăng có thể gợi: Nỗi nhớ quê hương, Tình cảm tri âm, Sự đoàn viên, Cô đơn và chia biệt, Vẻ đẹp thanh tao, Thời gian và sự vô thường, Tâm thức thiền định, Sự soi chiếu nội tâm. Ý nghĩa cụ thể phải được xác định từ văn cảnh, chủ thể trữ tình, truyền thống văn hóa và cấu trúc tác phẩm.</p>

            <h4>1.6. Phân biệt sự thật, giả thuyết và diễn giải</h4>
            <p>Mọi nhận định học thuật nên được phân thành bốn cấp: Dữ kiện (có căn cứ văn bản/lịch sử) -> Giả thuyết (có khả năng đúng nhưng cần chứng cứ) -> Diễn giải (cách đọc dựa trên lập luận) -> Cảm nhận (phản ứng thẩm mỹ). Không trình bày một liên tưởng cá nhân như một sự thật lịch sử.</p>
        `
    },
    {
        title: "Quyển II. Thi Pháp Học Và Mỹ Học",
        content: `
            <h4>2.1. Khái niệm thi pháp học</h4>
            <p>Là lĩnh vực nghiên cứu những nguyên tắc, phương thức và đặc điểm tổ chức nghệ thuật của tác phẩm văn học. Nghiên cứu cách tác phẩm được tổ chức, hình tượng xây dựng ra sao, thời gian/không gian vận động thế nào, ngôn ngữ tạo hiệu quả gì và các yếu tố kết hợp thành chỉnh thể như thế nào.</p>

            <h4>2.2. Hệ thống bốn tầng phân tích âm hưởng và sức sống thi ca</h4>
            <p><b>Tầng 1. Tính nhạc – Vẻ đẹp âm thanh</b></p>
            <ul>
                <li><b>Thanh điệu:</b> Tiếng Việt có 6 thanh (ngang, huyền, sắc, hỏi, ngã, nặng). Nhóm Bằng (ngang, huyền) và Trắc (sắc, hỏi, ngã, nặng).</li>
                <li><b>Vần:</b> Vần chân, vần lưng, vần liền, vần cách, vần ôm, vần chính, vần thông.</li>
                <li><b>Nhịp:</b> Cách tổ chức điểm ngắt (2/2/2, 3/3, 4/4...).</li>
                <li><b>Phối âm:</b> Lựa chọn nguyên âm, phụ âm, âm mở (ngân dài), âm khép (dứt khoát).</li>
                <li><b>Điệp âm, điệp từ:</b> Nhấn mạnh, tạo nhạc tính, liên kết hình tượng.</li>
            </ul>
            <p><b>Tầng 2. Điệu thơ – Nhịp vận động cảm xúc</b></p>
            <ul>
                <li><b>Sắc điệu:</b> Trang trọng, Trữ tình, U hoài, Bi tráng, Hào sảng, Thanh thoát, Châm biếm, Thiền vị.</li>
                <li>Một bài thơ có thể chuyển điệu trong quá trình phát triển (từ thanh tân đến hoài niệm, từ phấn khởi đến lắng đọng).</li>
            </ul>
            <p><b>Tầng 3. Thần thái – Khí chất nghệ thuật</b></p>
            <ul>
                <li><b>Các phẩm chất:</b> Cổ phong, Thanh tân, Thanh nhã, Hào sảng, Bi tráng, U nhã, Phóng khoáng, Dân gian.</li>
                <li>Thần thái không chỉ nằm trong từ ngữ mà còn ở hình tượng, cấu trúc, giọng điệu.</li>
            </ul>
            <p><b>Tầng 4. Hồn thơ – Sức sống tinh thần</b></p>
            <ul>
                <li>Khảo sát qua 5 thành tố: Tình (cảm xúc), Ý (tư tưởng), Cảnh (hình tượng), Điệu (nhịp vận động), Thần (khí chất). Hồn thơ là sự hòa quyện của toàn bộ chỉnh thể.</li>
            </ul>

            <h4>2.3. Các cặp phạm trù thi pháp</h4>
            <ul>
                <li><b>Tĩnh và Động:</b> Dĩ động tả tĩnh (Dùng chuyển động/âm thanh nhỏ để làm nổi bật sự tĩnh lặng).</li>
                <li><b>Không gian nghệ thuật:</b> Không gian thực, tâm tưởng, thiên nhiên, làng quê, đô thị, chiến trận...</li>
                <li><b>Thời gian nghệ thuật:</b> Tuyến tính, tuần hoàn, đồng hiện, hồi tưởng, dự cảm, thời gian tâm lý.</li>
                <li><b>Tả cảnh ngụ tình:</b> Cảnh vật được lựa chọn để biểu đạt tâm trạng (cần tìm mối liên hệ cụ thể).</li>
                <li><b>Hàm súc và ý tại ngôn ngoại:</b> Chứa đựng nhiều ý nghĩa trong ngôn từ cô đọng, ý vượt ra ngoài lớp nghĩa trực tiếp.</li>
                <li><b>Thi trung hữu họa / Thi trung hữu nhạc:</b> Thơ có khả năng tạo ra hình ảnh như hội họa và âm hưởng như âm nhạc.</li>
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
                <li><b>Biểu hiện văn học:</b> Tâm thế nhàn dật, hòa hợp thiên nhiên, chất vấn danh lợi, cảm hứng tiêu dao.</li>
            </ul>

            <h4>3.4. Phật giáo – Chiêm nghiệm, từ bi và giải thoát</h4>
            <ul>
                <li><b>Cốt lõi:</b> Tứ diệu đế (Khổ, Tập, Diệt, Đạo), Duyên khởi, Vô thường, Vô ngã, Nghiệp (hành động có tác ý), Từ bi, Bát chính đạo.</li>
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

            <h4>4.2. Hệ thống thể thơ</h4>
            <ul>
                <li><b>Lục bát:</b> Dòng 6 và 8 tiếng luân phiên, có hệ thống gieo vần đặc trưng.</li>
                <li><b>Song thất lục bát:</b> 2 dòng 7 tiếng, 1 dòng 6 tiếng, 1 dòng 8 tiếng.</li>
                <li><b>Thất ngôn tứ tuyệt / bát cú:</b> 4 câu / 8 câu, mỗi câu 7 tiếng, có quy tắc niêm luật vần đối.</li>
                <li><b>Ngũ ngôn:</b> Mỗi dòng 5 tiếng.</li>
                <li><b>Thơ tự do:</b> Không giới hạn số tiếng/câu cố định nhưng vẫn cần cấu trúc và nhạc tính.</li>
            </ul>

            <h4>4.3. Phân định các tác phẩm tiêu biểu</h4>
            <ul>
                <li><b>Nam quốc sơn hà:</b> Thơ chữ Hán.</li>
                <li><b>Bình Ngô đại cáo:</b> Văn chính luận, thể cáo, chữ Hán.</li>
                <li><b>Truyện Kiều:</b> Truyện thơ Nôm, lục bát.</li>
                <li><b>Chinh phụ ngâm:</b> Ngâm khúc, bản diễn Nôm nổi tiếng dùng song thất lục bát.</li>
                <li><b>Qua Đèo Ngang / Câu cá mùa thu:</b> Thơ Nôm Đường luật.</li>
                <li><b>Tây Tiến:</b> Thơ kháng chiến chống Pháp (Không xếp vào Thơ Mới).</li>
                <li><b>Việt Bắc:</b> Thơ trữ tình chính trị, thể lục bát.</li>
                <li><b>Đồng chí:</b> Thơ kháng chiến, thể thơ tự do có tổ chức nhịp điệu riêng.</li>
            </ul>

            <h4>4.4. Văn học Việt Nam và Thế giới</h4>
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
            <h4>6.1. Văn bản gốc (Bất di bất dịch)</h4>
            <blockquote style="border-left: 3px solid var(--accent); padding-left: 15px; font-style: italic; margin: 15px 0; color: var(--text-main); line-height: 2;">
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
                <li><b>Vọng:</b> Hướng về, trông ngóng, hoài niệm (Vọng về ký ức, vọng xa hoài vọng, vọng lại dư âm).</li>
                <li><b>Khúc:</b> Gợi chỉnh thể âm nhạc, khúc ca.</li>
                <li><b>Thanh xuân:</b> Độ tuổi, miền ký ức, khát vọng.</li>
                <li><b>Ý nghĩa tổng hợp:</b> Khúc ca vọng về từ miền ký ức tuổi trẻ, ngân vang tình cảm và hoài vọng tương lai.</li>
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
            <p>Tình thầy trò, Tôn sư trọng đạo, Kế thừa truyền thống, Trách nhiệm. "Điển xưa tích cũ" là tiếp nhận di sản. "Dặm trường" là bước vào đời. "Cội nguồn văn hóa" là ý thức gìn giữ. (Lưu ý: Không ép thành lời thề lập công danh).</p>

            <h4>6.7. Dưới lăng kính Đạo gia</h4>
            <p>Sự chuyển mùa, vẻ đẹp tự nhiên, áo dài bay, ánh trăng thanh tĩnh, không gian làng quê. Mỹ cảm thuận tự nhiên, thanh thoát, tự tại. (Lưu ý: Không đồng nhất hình ảnh thiên nhiên với giáo lý vô vi).</p>

            <h4>6.8. Mở rộng Phật giáo</h4>
            <p>Thời gian, vô thường, gặp gỡ chia xa, lòng biết ơn, sự trao truyền tình thương. (Hướng đọc mở rộng, không phải bằng chứng trực tiếp).</p>

            <h4>6.9. Tổng hợp tư tưởng</h4>
            <p>Nho gia làm nổi bật trách nhiệm, tri ân, kế thừa; Đạo gia mở ra mỹ cảm thanh thoát, tự tại. "Đi xa mà chẳng lìa nguồn cội, trưởng thành mà không quên người dẫn dắt, nhập thế mà vẫn giữ được tâm hồn thanh thoát."</p>
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

            <h4>Lời Kết – Hệ Thống Tư Duy Của Người Sáng Tác</h4>
            <p>Văn học không chỉ là nghệ thuật của ngôn từ mà còn là nơi hội tụ của lịch sử, văn hóa, triết học, tâm lý, mỹ học và đời sống con người.</p>
            <ul>
                <li>Người đọc sâu cần biết truy nguyên, đối chiếu và đặt câu hỏi.</li>
                <li>Người nghiên cứu cần phân biệt dữ kiện với diễn giải, biết kiểm chứng và tôn trọng sự phức tạp của văn bản.</li>
                <li>Người sáng tác cần có tri thức rộng, cảm xúc chân thành, khả năng quan sát tinh tế và bản lĩnh sáng tạo độc lập.</li>
            </ul>
            <p><b>Tuyên ngôn cuối cùng:</b><br>
            Học rộng để nhìn thấy nhiều chân trời.<br>
            Học sâu để hiểu được bản chất.<br>
            Cảm thụ tinh tế để nhận ra vẻ đẹp.<br>
            Suy tưởng độc lập để hình thành tư tưởng.<br>
            Sáng tạo tự do để kiến tạo phong cách.</p>
            <p>Thơ có xác nhờ ngôn từ, có hình nhờ hình tượng, có thanh nhờ tính nhạc, có điệu nhờ cảm xúc vận động, có thần nhờ khí chất và có hồn nhờ sự hòa quyện của tất cả những điều ấy.</p>
            <p>Đừng chỉ học cách viết một câu thơ đẹp. Hãy học cách nhìn thế giới bằng một tâm hồn có chiều sâu, một trí tuệ có chân trời và một thẩm mỹ có bản sắc.</p>
        `
    }
];


/* =====================================================================
   PHẦN 3: DỮ LIỆU TRÍCH DẪN & MARQUEE
   ===================================================================== */
const QUOTES_DATA = [
    { text: "Văn học là nhân học.", author: "M. Gorky" },
    { text: "Thơ là tiếng nói của tâm hồn.", author: "Khuyết danh" },
    { text: "Học nhi thời tập chi, bất diệc duyệt hồ.", author: "Khổng Tử" },
    { text: "Thi trung hữu họa, thi trung hữu nhạc.", author: "Cổ nhân" },
    { text: "Học rộng để nhìn thấy nhiều chân trời, học sâu để hiểu được bản chất.", author: "Văn Đạo" },
    { text: "Nho gia là đạo lý để bước vào đời; Đạo gia là một tâm thế để đi qua đời.", author: "Văn Đạo" },
    { text: "Tri thức giúp câu thơ có chiều sâu; cảm xúc giúp câu thơ có linh hồn.", author: "Văn Đạo" }
];

const MARQUEE_KEYWORDS = [
    "Thơ Đường Luật", "Truyện Kiều", "Nho - Đạo - Phật", "Biểu tượng Á Đông", 
    "Thi pháp học", "Thất ngôn bát cú", "Lục bát", "Văn học dân gian",
    "Tản Đà", "Thơ Mới", "Nam Cao", "Xuân Diệu", "Ca dao", "Tục ngữ", 
    "Điển tích", "Tứ đại giai không", "Bạch Ngọc Liên", "Thủy Mặc"
];