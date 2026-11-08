/* =====================================================================
   VĂN ĐẠO ENGINE - DỮ LIỆU VĂN HIẾN (HERITAGE DATA)
   Tác giả: Văn Đạo
   Mô tả: Kho tàng văn học đồ sộ với 60+ tác phẩm, chia làm 7 nhóm chính.
   ===================================================================== */
const HERITAGE_DATA = [
    
    // =================================================================
    // NHÓM 1: VĂN HỌC DÂN GIAN (Truyền miệng)
    // =================================================================
    { title: "Con Rồng Cháu Tiên", author: "Dân gian", genre: "Truyền thuyết", era: "Thời Hồng Bàng", script: "Truyền miệng", desc: "Giải thích nguồn gốc cao quý của dân tộc Việt Nam, phản ánh ý thức cộng đồng.", category: "dan-gian" },
    { title: "Sơn Tinh Thủy Tinh", author: "Dân gian", genre: "Truyền thuyết", era: "Thời Hùng Vương", script: "Truyền miệng", desc: "Ca ngợi công cuộc trị thủy và bảo vệ đất nước của cha ông ta.", category: "dan-gian" },
    { title: "Tấm Cám", author: "Dân gian", genre: "Cổ tích", era: "Không rõ", script: "Truyền miệng", desc: "Hành trình đấu tranh giành hạnh phúc của cô Tấm, thể hiện khát vọng công lý.", category: "dan-gian" },
    { title: "Thạch Sanh", author: "Dân gian", genre: "Cổ tích", era: "Không rõ", script: "Truyền miệng", desc: "Người hùng diệt chằn tinh, đại bàng và đánh đuổi giặc ngoại xâm.", category: "dan-gian" },
    { title: "Thánh Gióng", author: "Dân gian", genre: "Truyền thuyết", era: "Thời Hùng Vương", script: "Truyền miệng", desc: "Ca ngợi tinh thần yêu nước, chống giặc ngoại xâm của người anh hùng nhỏ tuổi.", category: "dan-gian" },
    
    // =================================================================
    // NHÓM 2: VĂN HỌC TRUNG ĐẠI (Chữ Hán & Chữ Nôm)
    // =================================================================
    { title: "Truyện Trê Cóc", author: "Khuyết danh", genre: "Truyện thơ Nôm", era: "TK 18", script: "Chữ Nôm", desc: "Tác phẩm trào phúng sâu sắc về xã hội phong kiến đầy bất công.", category: "trung-dai" },
    { title: "Nam quốc sơn hà", author: "Lý Thường Kiệt", genre: "Thất ngôn tứ tuyệt", era: "Nhà Lý", script: "Chữ Hán", desc: "Bản tuyên ngôn độc lập đầu tiên, khẳng định chủ quyền lãnh thổ.", category: "trung-dai" },
    { title: "Hịch tướng sĩ", author: "Trần Quốc Tuấn", genre: "Hịch", era: "Nhà Trần", script: "Chữ Hán", desc: "Lời kêu gọi tinh thần yêu nước, quyết chiến chống quân Nguyên Mông.", category: "trung-dai" },
    { title: "Phò giá về kinh", author: "Trần Quang Khải", genre: "Ngũ ngôn tứ tuyệt", era: "Nhà Trần", script: "Chữ Hán", desc: "Hào khí chiến thắng và khát vọng thái bình thịnh trị của dân tộc.", category: "trung-dai" },
    { title: "Phú sông Bạch Đằng", author: "Trương Hán Siêu", genre: "Phú", era: "Nhà Trần", script: "Chữ Hán", desc: "Hoài niệm chiến công lịch sử, ca ngợi truyền thống yêu nước.", category: "trung-dai" },
    { title: "Bình Ngô Đại Cáo", author: "Nguyễn Trãi", genre: "Cáo", era: "Nhà Lê sơ", script: "Chữ Hán", desc: "Áng văn chính luận mẫu mực, tuyên bố chiến thắng quân Minh và khẳng định nền độc lập.", category: "trung-dai" },
    { title: "Truyện Kiều", author: "Nguyễn Du", genre: "Truyện thơ Nôm (Lục bát)", era: "Triều Nguyễn", script: "Chữ Nôm", desc: "Tác phẩm kiệt xuất nhất của văn học trung đại Việt Nam, kể về cuộc đời gian truân của Thúy Kiều.", category: "trung-dai" },
    { title: "Chinh Phụ Ngâm (Bản Nôm)", author: "Đoàn Thị Điểm (dịch)", genre: "Song thất lục bát", era: "TK 18", script: "Chữ Nôm", desc: "Bản diễn Nôm nổi tiếng từ nguyên tác chữ Hán của Đặng Trần Côn, khúc ngâm về nỗi sầu muộn của người vợ chờ chồng.", category: "trung-dai" },
    { title: "Qua Đèo Ngang", author: "Bà Huyện Thanh Quan", genre: "Thất ngôn bát cú", era: "Triều Nguyễn", script: "Chữ Nôm", desc: "Bức tranh thiên nhiên và tâm trạng hoài cổ, cô đơn của tác giả khi dừng chân trên đèo.", category: "trung-dai" },
    { title: "Câu cá mùa thu", author: "Nguyễn Khuyến", genre: "Thất ngôn bát cú", era: "Cuối TK 19", script: "Chữ Nôm", desc: "Bức tranh mùa thu thanh tĩnh ở làng quê, ẩn chứa tâm sự yêu nước thầm kín.", category: "trung-dai" },
    { title: "Bánh Trôi Nước", author: "Hồ Xuân Hương", genre: "Thất ngôn tứ tuyệt", era: "Cuối Lê - Đầu Nguyễn", script: "Chữ Nôm", desc: "Tiếng nói bênh vực và ca ngợi vẻ đẹp, phẩm chất của người phụ nữ.", category: "trung-dai" },
    { title: "Nhàn", author: "Nguyễn Bỉnh Khiêm", genre: "Thất ngôn bát cú", era: "Nhà Mạc", script: "Chữ Nôm", desc: "Vẻ đẹp thanh cao, tâm thế nhàn dật của kẻ sĩ trước thời cuộc.", category: "trung-dai" },
    { title: "Lục Vân Tiên", author: "Nguyễn Đình Chiểu", genre: "Truyện thơ Nôm", era: "TK 19", script: "Chữ Nôm", desc: "Truyện thơ ca ngợi tinh thần nghĩa hiệp, đạo lý làm người.", category: "trung-dai" },
    { title: "Văn tế nghĩa sĩ Cần Giuộc", author: "Nguyễn Đình Chiểu", genre: "Văn tế", era: "TK 19", script: "Chữ Nôm", desc: "Tiếng khóc bi tráng cho những người nông dân nghĩa sĩ hy sinh vì nước.", category: "trung-dai" },

    // =================================================================
    // NHÓM 3: VĂN HỌC HIỆN ĐẠI (Thế kỷ 20)
    // =================================================================
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

    // =================================================================
    // NHÓM 4: VĂN HỌC THẾ GIỚI
    // =================================================================
    { title: "Tĩnh Dạ Tứ", author: "Lý Bạch", genre: "Ngũ ngôn tứ tuyệt", era: "Thịnh Đường", script: "Chữ Hán", desc: "Nỗi nhớ quê hương da diết của thi tiên Lý Bạch.", category: "the-gioi" },
    { title: "Đăng Cao", author: "Đỗ Phủ", genre: "Thất ngôn bát cú", era: "Thịnh Đường", script: "Chữ Hán", desc: "Nỗi buồn thời cuộc, thân phận con người trước thiên nhiên rộng lớn.", category: "the-gioi" },
    { title: "Thần Khúc", author: "Dante", genre: "Trường ca", era: "Thời Phục Hưng", script: "Tiếng Ý", desc: "Hành trình qua Địa ngục, Luyện ngục và Thiên đường.", category: "the-gioi" },
    { title: "Hamlet", author: "Shakespeare", genre: "Bi kịch", era: "TK 16-17", script: "Tiếng Anh", desc: "Vở kịch kinh điển về sự trả thù và những trăn trở triết học.", category: "the-gioi" },
    { title: "Hoàng Tử Bé", author: "Antoine de Saint-Exupéry", genre: "Tiểu thuyết", era: "1943", script: "Tiếng Pháp", desc: "Câu chuyện triết lý sâu sắc dành cho cả người lớn và trẻ em.", category: "the-gioi" },
    { title: "Chiến tranh và Hòa bình", author: "Lev Tolstoy", genre: "Tiểu thuyết sử thi", era: "1869", script: "Tiếng Nga", desc: "Bức tranh hoành tráng về xã hội Nga trong cuộc chiến tranh Napoleon.", category: "the-gioi" },

    // =================================================================
    // NHÓM 5: CA DAO - TỤC NGỮ
    // =================================================================
    { title: "Tục ngữ về thiên nhiên", author: "Dân gian", genre: "Tục ngữ", era: "Truyền miệng", script: "Quốc ngữ", desc: "Kinh nghiệm dự báo thời tiết, quan sát tự nhiên (VD: 'Chuồn chuồn bay thấp...').", category: "ca-dao" },
    { title: "Tục ngữ về đạo lý", author: "Dân gian", genre: "Tục ngữ", era: "Truyền miệng", script: "Quốc ngữ", desc: "Bài học ứng xử, triết lý sống (VD: 'Uống nước nhớ nguồn').", category: "ca-dao" },
    { title: "Ca dao than thân", author: "Dân gian", genre: "Ca dao", era: "Truyền miệng", script: "Quốc ngữ", desc: "Tiếng nói phản kháng, than thở về số phận bất hạnh (VD: 'Thân em như tấm lụa đào...').", category: "ca-dao" },
    { title: "Ca dao yêu thương tình nghĩa", author: "Dân gian", genre: "Ca dao", era: "Truyền miệng", script: "Quốc ngữ", desc: "Tình cảm gia đình, tình yêu đôi lứa, tình bạn.", category: "ca-dao" },
    { title: "Ca dao hài hước", author: "Dân gian", genre: "Ca dao", era: "Truyền miệng", script: "Quốc ngữ", desc: "Tiếng cười tự trào, phê phán thói hư tật xấu.", category: "ca-dao" },
    
    // --- Ca dao - Tục ngữ về Người Thầy (Bổ sung) ---
    { title: "Muốn sang thì bắc cầu Kiều", author: "Dân gian", genre: "Ca dao", era: "Truyền miệng", script: "Quốc ngữ", desc: "Muốn sang thì bắc cầu Kiều,<br>Muốn con hay chữ thì yêu lấy thầy.", category: "ca-dao" },
    { title: "Thời gian dẫu bạc mái đầu", author: "Dân gian", genre: "Ca dao", era: "Truyền miệng", script: "Quốc ngữ", desc: "Thời gian dẫu bạc mái đầu,<br>Tim trò vẫn tạc đậm câu ơn thầy.", category: "ca-dao" },
    { title: "Mồng một Tết cha...", author: "Dân gian", genre: "Tục ngữ", era: "Truyền miệng", script: "Quốc ngữ", desc: "Mồng một Tết cha, mồng hai Tết mẹ, mồng ba Tết thầy.", category: "ca-dao" },
    { title: "Dạy con từ thuở tiểu sinh", author: "Dân gian", genre: "Ca dao", era: "Truyền miệng", script: "Quốc ngữ", desc: "Dạy con từ thuở tiểu sinh,<br>Gần thầy gần bạn tập tành lễ nghi.<br>Học cho 'cách vật trí tri',<br>Văn chương chữ nghĩa nghề gì cũng thông.", category: "ca-dao" },
    { title: "Ơn thầy soi lối mở đường", author: "Dân gian", genre: "Ca dao", era: "Truyền miệng", script: "Quốc ngữ", desc: "Ơn thầy soi lối mở đường,<br>Cho con vững bước dặm trường tương lai.", category: "ca-dao" },
    { title: "Chữ thầy trong cõi người ta", author: "Dân gian", genre: "Ca dao", era: "Truyền miệng", script: "Quốc ngữ", desc: "Chữ thầy trong cõi người ta,<br>Dặm dài hoa nắng trời xa biển đầy.", category: "ca-dao" },

    // =================================================================
    // NHÓM 6: ĐIỂN TÍCH - ĐIỂN CỐ
    // =================================================================
    { title: "Sân Lai", author: "Điển cố Trung Hoa", genre: "Điển cố", era: "Thời Xuân Thu", script: "Chữ Hán", desc: "Lão Lai Tử mặc áo trẻ con để mua vui cho cha mẹ. Chỉ lòng hiếu thảo.", category: "dien-tich" },
    { title: "Ngưu Lang - Chức Nữ", author: "Điển tích Trung Hoa", genre: "Điển tích", era: "Truyền thuyết", script: "Chữ Hán", desc: "Biểu tượng của tình yêu đôi lứa bị ngăn cách, gặp nhau ngày Thất tịch.", category: "dien-tich" },
    { title: "Gót sen ba tấc", author: "Điển cố Trung Hoa", genre: "Điển cố", era: "Thời Nam Tề", script: "Chữ Hán", desc: "Chỉ đôi chân nhỏ của người phụ nữ thời phong kiến (tục bó chân).", category: "dien-tich" },
    { title: "Làn thu thủy, nét xuân sơn", author: "Nguyễn Du", genre: "Điển tích", era: "Truyện Kiều", script: "Chữ Nôm", desc: "Tả vẻ đẹp sắc sảo, đoan trang của Thúy Kiều (mắt trong như nước mùa thu, lông mày đẹp như núi mùa xuân).", category: "dien-tich" },
    { title: "Khuôn trăng đầy đặn, nét ngài nở nang", author: "Nguyễn Du", genre: "Điển tích", era: "Truyện Kiều", script: "Chữ Nôm", desc: "Tả vẻ đẹp phúc hậu, đoan trang của Thúy Vân.", category: "dien-tich" },
    { title: "Bèo dạt mây trôi", author: "Điển tích Việt Nam", genre: "Thành ngữ", era: "Dân gian", script: "Quốc ngữ", desc: "Chỉ thân phận trôi nổi, vô định, không biết đi về đâu.", category: "dien-tich" },
    { title: "Chim lồng cá chậu", author: "Điển tích Việt Nam", genre: "Điển cố", era: "Dân gian", script: "Quốc ngữ", desc: "Chỉ hoàn cảnh bị giam hãm, mất tự do, không thể phát triển.", category: "dien-tich" },

    // =================================================================
    // NHÓM 7: TRUYỆN CƯỜI DÂN GIAN
    // =================================================================
    { title: "Tam Đại Con Gà", author: "Dân gian", genre: "Truyện cười", era: "Không rõ", script: "Truyền miệng", desc: "Chế giễu thói dốt nát hay khoe khoang của thầy đồ (Dủ dỉ là con dù dì).", category: "truyen-cuoi" },
    { title: "Nhưng Nó Phải Bằng Hai Mày", author: "Dân gian", genre: "Truyện cười", era: "Không rõ", script: "Truyền miệng", desc: "Đả kích sự tham nhũng, hối lộ của quan lại phong kiến (Lý trưởng, Cải, Ngô).", category: "truyen-cuoi" },
    { title: "Lợn Cưới, Áo Mới", author: "Dân gian", genre: "Truyện cười", era: "Không rõ", script: "Truyền miệng", desc: "Chế giễu tính hay khoe của, kệch cỡm của những kẻ giàu mới nổi.", category: "truyen-cuoi" },
    { title: "Treo Biển", author: "Dân gian", genre: "Truyện cười", era: "Không rõ", script: "Truyền miệng", desc: "Phê phán những người thiếu bản lĩnh, thiếu lập trường, ai nói gì cũng nghe.", category: "truyen-cuoi" },
    { title: "Đẽo Cày Giữa Đường", author: "Dân gian", genre: "Truyện cười", era: "Không rõ", script: "Truyền miệng", desc: "Khuyên răn con người cần có chính kiến, không nên ba phải, làm theo lời góp ý mù quáng.", category: "truyen-cuoi" },
    { title: "Thầy Bói Xem Voi", author: "Dân gian", genre: "Truyện ngụ ngôn", era: "Không rõ", script: "Truyền miệng", desc: "Bài học về việc nhìn nhận sự vật một cách phiến diện, chỉ thấy bộ phận mà không thấy toàn thể.", category: "truyen-cuoi" },
    { title: "Lão Miệng, Tai, Mắt, Mũi", author: "Dân gian", genre: "Truyện ngụ ngôn", era: "Không rõ", script: "Truyền miệng", desc: "Mượn câu chuyện các bộ phận cơ thể để nói về sự gắn kết, tương trợ trong cộng đồng.", category: "truyen-cuoi" },
    { title: "Cháy Nhà Ra Mặt Chuột", author: "Dân gian", genre: "Truyện cười", era: "Không rõ", script: "Truyền miệng", desc: "Tình huống khó khăn mới bộc lộ được bản chất, tính cách thật của con người.", category: "truyen-cuoi" }
];
