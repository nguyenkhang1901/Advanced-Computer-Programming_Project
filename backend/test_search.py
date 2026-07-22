import sys
from server import retrieve_context

if __name__ == '__main__':
    queries = [
        "học bổng",
        "trí tuệ nhân tạo",
        "computer science"
    ]
    
    for query in queries:
        print(f"=== KẾT QUẢ TÌM KIẾM CHO CÂU HỎI: '{query}' ===")
        result = retrieve_context(query, top_k=1)
        print(result[:400] + "...\n(Đã cắt bớt nội dung)\n")
