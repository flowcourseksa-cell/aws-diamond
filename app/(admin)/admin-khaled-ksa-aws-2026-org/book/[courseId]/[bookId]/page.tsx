"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { IconBook2, IconArrowLeft, IconPlus, IconTrash, IconChevronUp, IconChevronDown, IconEye, IconEyeOff, IconMessageCircle2, IconX, IconArrowBackUp, IconBan } from "@tabler/icons-react";
import { fetchBookPages, fetchPageComments, fetchBooksByIds, type BookPage, type BookComment, type Book } from "@/lib/supabase/services/book";
import { addBookPage, updateBookPage, deleteBookPage, reorderBookPages, deleteBookComment, uploadBookPageImage, toggleStudentCommentBan } from "@/lib/supabase/services/book-actions";
import { createClient } from "@/lib/supabase/client";

export default function AdminBookManagerPage({ params }: { params: Promise<{ courseId: string; bookId: string }> }) {
  const unwrappedParams = use(params);
  const courseId = unwrappedParams.courseId;
  const bookId = unwrappedParams.bookId;

  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(true);

  // New page form
  const [newImageUrl, setNewImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments modal state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [comments, setComments] = useState<BookComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchBooksByIds([bookId]),
      fetchBookPages(bookId)
    ]).then(([booksData, pagesData]) => {
      const b = booksData.find(b => b.id === bookId);
      if (b) setBook(b);
      setPages(pagesData);
      setLoading(false);
    });
  }, [bookId]);

  const handleAddPage = async () => {
    if (!newImageUrl.trim() && !file) return alert("يرجى إدخال رابط الصورة أو اختيار ملف");
    setIsSubmitting(true);
    
    let finalUrl = newImageUrl.trim();
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      const uploadedUrl = await uploadBookPageImage(formData);
      if (!uploadedUrl) {
        alert("فشل رفع الصورة");
        setIsSubmitting(false);
        return;
      }
      finalUrl = uploadedUrl;
    }

    // Auto-calculate next page number
    const nextNumber = pages.length > 0 ? Math.max(...pages.map(p => p.page_number)) + 1 : 1;
    
    const success = await addBookPage({
      book_id: bookId,
      page_number: nextNumber,
      image_url: finalUrl,
    });

    if (success) {
      setNewImageUrl("");
      setFile(null);
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      const updated = await fetchBookPages(bookId);
      setPages(updated);
    } else {
      alert("حدث خطأ أثناء إضافة الصفحة");
    }
    setIsSubmitting(false);
  };

  const handleUploadPDF = async () => {
    if (!pdfFile) return;
    setIsSubmitting(true);
    setUploadProgress("جاري تهيئة ملف الـ PDF...");
    
    try {
      // @ts-ignore
      const pdfjsLib = await import("pdfjs-dist/build/pdf.min.js");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      setUploadProgress(`تم العثور على ${numPages} صفحة. جاري بدء المعالجة والرفع... (لا تغلق الصفحة)`);

      // Find the next starting page number
      let nextNumber = pages.length > 0 ? Math.max(...pages.map(p => p.page_number)) + 1 : 1;

      // Upload in batches of 3 to speed up significantly without hitting rate limits
      for (let i = 1; i <= numPages; i += 3) {
        const batch = [];
        for (let j = 0; j < 3 && i + j <= numPages; j++) {
          const pageNum = i + j;
          batch.push((async () => {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 }); // Balanced scale for speed & quality

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error("Could not create canvas context");
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport } as any).promise;

            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8)); // 0.8 quality for smaller file size
            if (!blob) throw new Error("Failed to create blob from canvas");

            const imageFile = new File([blob], `page_${pageNum}.jpg`, { type: 'image/jpeg' });
            const formData = new FormData();
            formData.append("file", imageFile);

            const uploadedUrl = await uploadBookPageImage(formData);
            if (!uploadedUrl) {
              console.error(`Failed to upload page ${pageNum}`);
              return null;
            }

            return uploadedUrl;
          })());
        }

        setUploadProgress(`جاري معالجة ورفع الصفحات ${i} إلى ${Math.min(i + 2, numPages)} من ${numPages}...`);
        const urls = await Promise.all(batch);

        for (const uploadedUrl of urls) {
          if (uploadedUrl) {
            await addBookPage({
              book_id: bookId,
              page_number: nextNumber++,
              image_url: uploadedUrl,
            });
          }
        }
      }

      setUploadProgress("تم رفع وتكوين الكتاب بالكامل بنجاح!");
      setPdfFile(null);
      const fileInput = document.getElementById("pdf-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      const updated = await fetchBookPages(bookId);
      setPages(updated);

    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ أثناء معالجة الـ PDF: " + err.message);
      setUploadProgress("فشلت العملية.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setUploadProgress(""), 5000);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصفحة؟")) return;
    const success = await deleteBookPage(id);
    if (success) {
      setPages(pages.filter(p => p.id !== id));
    }
  };

  const handleTogglePublish = async (page: BookPage) => {
    const success = await updateBookPage(page.id, { is_published: !page.is_published });
    if (success) {
      setPages(pages.map(p => p.id === page.id ? { ...p, is_published: !p.is_published } : p));
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newPages = [...pages];
    const temp = newPages[index].page_number;
    newPages[index].page_number = newPages[index - 1].page_number;
    newPages[index - 1].page_number = temp;
    
    // sort locally
    newPages.sort((a, b) => a.page_number - b.page_number);
    setPages(newPages);

    await reorderBookPages([
      { id: newPages[index].id, page_number: newPages[index].page_number },
      { id: newPages[index - 1].id, page_number: newPages[index - 1].page_number }
    ]);
  };

  const handleMoveDown = async (index: number) => {
    if (index === pages.length - 1) return;
    const newPages = [...pages];
    const temp = newPages[index].page_number;
    newPages[index].page_number = newPages[index + 1].page_number;
    newPages[index + 1].page_number = temp;
    
    newPages.sort((a, b) => a.page_number - b.page_number);
    setPages(newPages);

    await reorderBookPages([
      { id: newPages[index].id, page_number: newPages[index].page_number },
      { id: newPages[index + 1].id, page_number: newPages[index + 1].page_number }
    ]);
  };

  const openComments = async (pageId: string) => {
    setSelectedPageId(pageId);
    setIsCommentsOpen(true);
    setLoadingComments(true);
    const data = await fetchPageComments(pageId);
    setComments(data);
    setLoadingComments(false);
  };

  const closeComments = () => {
    setIsCommentsOpen(false);
    setSelectedPageId(null);
    setComments([]);
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;
    const success = await deleteBookComment(id);
    if (success) {
      if (selectedPageId) {
        const data = await fetchPageComments(selectedPageId);
        setComments(data);
      }
    }
  };

  const handleAdminReply = async (commentId: string) => {
    if (!replyBody.trim()) return;
    setIsReplying(true);
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && selectedPageId) {
      const { error } = await supabase.from("book_page_comments").insert({
        page_id: selectedPageId,
        student_id: user.id,
        body: replyBody,
        parent_id: commentId,
        is_admin_reply: true
      });
      if (!error) {
        setReplyBody("");
        setReplyingTo(null);
        const data = await fetchPageComments(selectedPageId);
        setComments(data);
      } else {
        alert("فشل إضافة الرد");
      }
    }
    setIsReplying(false);
  };

  const handleBanStudent = async (studentId: string) => {
    if (confirm("هل تريد حظر هذا الطالب من التعليقات كلياً؟")) {
      const success = await toggleStudentCommentBan(studentId, true);
      if (success) {
        alert("تم الحظر بنجاح");
      } else {
        alert("حدث خطأ أثناء الحظر");
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">جاري التحميل...</div>;
  if (!book) return <div className="p-8 text-center text-red-500 font-bold">لم يتم العثور على الكتاب!</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <IconBook2 size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">الكتاب التفاعلي: {book.title}</h1>
              <p className="text-slate-500 mt-1">أضف ورتب صفحات هذا الكتاب.</p>
            </div>
          </div>
          <Link href={`/admin-khaled-ksa-aws-2026-org/book/${courseId}`} className="flex items-center gap-2 text-primary hover:text-primary/80 font-bold bg-primary/5 px-4 py-2 rounded-xl transition-colors">
            <IconArrowLeft size={20} />
            العودة للكتب
          </Link>
        </div>
      </div>

      {/* Add Page Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="font-bold text-lg mb-4">إضافة صفحة جديدة</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500">رفع صورة من الجهاز:</span>
              <input 
                id="file-upload"
                type="file" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </div>
            <div className="text-slate-400 font-bold">أو</div>
            <input 
              type="text" 
              placeholder="رابط الصورة الخارجي (URL)" 
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              dir="ltr"
            />
          </div>
          <button 
            onClick={handleAddPage}
            disabled={isSubmitting || (!file && !newImageUrl.trim())}
            className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2 w-full md:w-auto self-end"
          >
            <IconPlus size={20} />
            {isSubmitting ? "جاري الإضافة..." : "إضافة الصفحة"}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-3 mb-6 pb-6 border-b border-slate-100">* يمكنك رفع الصورة مباشرة من جهازك أو لصق رابط لصورة مرفوعة مسبقاً.</p>

        {/* PDF Upload Section */}
        <h2 className="font-bold text-lg mb-4 text-primary">رفع كتاب كامل (ملف PDF)</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500">اختر ملف الـ PDF:</span>
              <input 
                id="pdf-upload"
                type="file" 
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
            </div>
          </div>
          <button 
            onClick={handleUploadPDF}
            disabled={isSubmitting || !pdfFile}
            className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 w-full md:w-auto self-end"
          >
            <IconBook2 size={20} />
            {isSubmitting && pdfFile ? "جاري المعالجة..." : "تفكيك ورفع الـ PDF"}
          </button>
          
          {uploadProgress && (
            <div className="mt-4 bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-3">
              {isSubmitting && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
              {uploadProgress}
            </div>
          )}
        </div>
      </div>

      {/* Pages List */}
      <div className="space-y-4">
        <h2 className="font-bold text-xl text-slate-800">الصفحات الحالية ({pages.length})</h2>
        {pages.length === 0 ? (
          <div className="bg-slate-50 p-8 rounded-2xl text-center text-slate-400 font-bold border border-slate-100 border-dashed">
            لا توجد صفحات في هذا الكتاب بعد. أضف الصفحة الأولى (الغلاف) من الأعلى.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pages.map((page, index) => (
              <div key={page.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="relative aspect-[3/4] bg-slate-100 border-b border-slate-100 group">
                  {page.image_url ? (
                    <img src={page.image_url} alt={`صفحة ${page.page_number}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <IconBook2 size={48} />
                      <span className="font-bold mt-2">لا توجد صورة</span>
                    </div>
                  )}
                  {!page.is_published && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="bg-white/90 text-slate-800 font-bold px-4 py-2 rounded-xl text-sm shadow-lg">مخفية</span>
                    </div>
                  )}

                  {/* Comments Overlay Button */}
                  <button 
                    onClick={() => openComments(page.id)}
                    className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur text-slate-800 font-bold py-2 px-4 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 hover:bg-white"
                  >
                    <IconMessageCircle2 size={18} className="text-primary" />
                    عرض التعليقات
                  </button>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-lg">صفحة {page.page_number}</span>
                    <button 
                      onClick={() => handleTogglePublish(page)}
                      className={`text-sm font-bold flex items-center gap-1 ${page.is_published ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                      title={page.is_published ? 'إخفاء الصفحة' : 'نشر الصفحة'}
                    >
                      {page.is_published ? <IconEye size={20} /> : <IconEyeOff size={20} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-auto">
                    <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                      <button 
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-white rounded-md disabled:opacity-30 transition-all"
                        title="تحريك لأعلى"
                      >
                        <IconChevronUp size={18} />
                      </button>
                      <button 
                        onClick={() => handleMoveDown(index)}
                        disabled={index === pages.length - 1}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-white rounded-md disabled:opacity-30 transition-all"
                        title="تحريك لأسفل"
                      >
                        <IconChevronDown size={18} />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleDeletePage(page.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <IconTrash size={16} />
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments Modal */}
      {isCommentsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <IconMessageCircle2 size={20} />
                </div>
                <h3 className="font-bold text-lg text-slate-800">تعليقات الصفحة</h3>
              </div>
              <button 
                onClick={closeComments}
                className="w-10 h-10 bg-white hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-slate-200"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingComments ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-bold">جاري تحميل التعليقات...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                  <IconMessageCircle2 size={48} className="opacity-20" />
                  <p className="font-bold">لا توجد تعليقات على هذه الصفحة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.filter(c => !c.parent_id).map(c => {
                    const replies = comments.filter(r => r.parent_id === c.id);
                    return (
                      <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                        {/* Root Comment */}
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${c.is_admin_reply ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {c.author_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm font-bold ${c.is_admin_reply ? 'text-primary' : 'text-slate-800'}`}>{c.author_name}</span>
                                {c.is_admin_reply && <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">الإدارة</span>}
                                <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('ar-SA')}</span>
                              </div>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.body}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          {!c.is_admin_reply && (
                            <div className="flex items-center gap-2 md:self-start">
                              <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="text-xs flex items-center gap-1 text-primary hover:underline">
                                <IconArrowBackUp size={14} /> رد
                              </button>
                              <button onClick={() => handleBanStudent(c.student_id)} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:underline bg-red-50 px-2 py-1 rounded">
                                <IconBan size={14} /> حظر كلي
                              </button>
                              <button onClick={() => handleDeleteComment(c.id)} className="flex items-center justify-center text-red-500 hover:bg-red-50 p-1.5 rounded">
                                <IconTrash size={16} />
                              </button>
                            </div>
                          )}
                          {c.is_admin_reply && (
                            <div className="md:self-start">
                              <button onClick={() => handleDeleteComment(c.id)} className="flex items-center justify-center text-red-500 hover:bg-red-50 p-1.5 rounded">
                                <IconTrash size={16} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Replies */}
                        {replies && replies.length > 0 && (
                          <div className="mt-4 mr-10 flex flex-col gap-3 border-r-2 border-slate-100 pr-4">
                            {replies.map(reply => (
                              <div key={reply.id} className="flex justify-between gap-4">
                                <div className="flex gap-3">
                                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs ${reply.is_admin_reply ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {reply.author_name?.charAt(0) || '?'}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs font-bold ${reply.is_admin_reply ? 'text-primary' : 'text-slate-800'}`}>{reply.author_name}</span>
                                      {reply.is_admin_reply && <span className="text-[9px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">الإدارة</span>}
                                      <span className="text-[10px] text-slate-400">{new Date(reply.created_at).toLocaleDateString('ar-SA')}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{reply.body}</p>
                                  </div>
                                </div>
                                <div className="flex items-center md:self-start">
                                  <button onClick={() => handleDeleteComment(reply.id)} className="flex items-center justify-center text-red-500 hover:bg-red-50 p-1.5 rounded">
                                    <IconTrash size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Reply Box */}
                      {replyingTo === c.id && (
                        <div className="mt-3 flex gap-2">
                          <input 
                            type="text"
                            placeholder="اكتب ردك كإدارة..."
                            value={replyBody}
                            onChange={e => setReplyBody(e.target.value)}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                          <button 
                            onClick={() => handleAdminReply(c.id)}
                            disabled={isReplying || !replyBody.trim()}
                            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
                          >
                            إرسال
                          </button>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}