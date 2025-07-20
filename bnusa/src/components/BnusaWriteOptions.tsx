import { FaBook, FaFile, FaChartLine, FaPen } from 'react-icons/fa';

export default function BnusaWriteOptions() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">لە بنووسە چی دەنووسی؟</h2>
        <p className="text-center text-lg text-gray-500 mb-12">چەندین جۆری جیاواز لە ناوڕۆک دەتوانیت لە بنووسە بڵاو بکەیتەوە، هەروەها وتاری درێژ تا شیعر و هۆنراوە</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* چیروک و داستان */}
          <div className="rounded-2xl bg-pink-50 p-8 flex flex-col items-start">
            <FaFile className="w-10 h-10 text-[var(--primary)] mb-4" />
            <h3 className="text-xl font-bold mb-2">چیڕۆک و داستان</h3>
            <p className="text-gray-600">بەهرەی خۆت لە نووسینی چیڕۆک و داستاندا پیشان بده و بەشی بکه لەگەڵ خوێنەران.</p>
          </div>
          {/* وتار و لیکۆلینەوە */}
          <div className="rounded-2xl bg-blue-50 p-8 flex flex-col items-start">
            <FaBook className="w-10 h-10 text-[var(--primary)] mb-4" />
            <h3 className="text-xl font-bold mb-2">وتار و لێکۆڵینەوە</h3>
            <p className="text-gray-600">وتاری درێژ و قسە و لیکۆلینەوەی تایبەت لەسەر هەر بابەتێک کە حەز دەکەیت بنووسی.</p>
          </div>
          {/* شیکاری و پۆچوون */}
          <div className="rounded-2xl bg-green-50 p-8 flex flex-col items-start">
            <FaChartLine className="w-10 h-10 text-[var(--primary)] mb-4" />
            <h3 className="text-xl font-bold mb-2">شیکاری و پۆچوون</h3>
            <p className="text-gray-600">شیکاری و پۆچوونی زانیاری و ئامارەکان لەسەر هەر بابەتێک کە پەیوەندی بە کۆمەڵگا هەیە.</p>
          </div>
          {/* شێعر و هۆنراوە */}
          <div className="rounded-2xl bg-purple-50 p-8 flex flex-col items-start">
            <FaPen className="w-10 h-10 text-[var(--primary)] mb-4" />
            <h3 className="text-xl font-bold mb-2">شیعر و هۆنراوە</h3>
            <p className="text-gray-600">شیعر و هۆنراوە و هەڵبەستەکانت بەشداری پێ بکە و بەشی بکە لەگەڵ خوێنەران.</p>
          </div>
        </div>
      </div>
    </section>
  );
} 