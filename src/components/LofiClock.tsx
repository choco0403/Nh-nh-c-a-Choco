import React, { useEffect, useState } from 'react';
import { formatLofiTime } from '../utils/characterLogic';

export const LofiClock: React.FC = () => {
  const [timeInfo, setTimeInfo] = useState(() => formatLofiTime());

  useEffect(() => {
    // --- HỆ THỐNG ĐỒNG HỒ & NHẮC NHỞ NGỦ ---
    function updateClock() {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();

      // Thêm số 0 đằng trước nếu nhỏ hơn 10 (vd: 9:5 -> 09:05)
      const displayHours = hours < 10 ? '0' + hours : String(hours);
      const displayMinutes = minutes < 10 ? '0' + minutes : String(minutes);
      const timeString = `${displayHours}:${displayMinutes}`;
      const isSleep = hours >= 23 || hours <= 4;

      // Cập nhật giờ lên web thông qua state
      setTimeInfo({
        displayHours,
        displayMinutes,
        timeString,
        isSleepTime: isSleep,
      });

      // Đảm bảo DOM ID trực tiếp cũng được cập nhật đúng như yêu cầu
      const timeElem = document.getElementById('current-time');
      if (timeElem) {
        timeElem.innerText = timeString;
      }

      // Kiểm tra xem đã đến giờ ngủ chưa (Từ 23h đêm đến 4h sáng)
      const reminder = document.getElementById('sleep-reminder');
      if (reminder) {
        if (isSleep) {
          reminder.classList.add('show-reminder');
        } else {
          reminder.classList.remove('show-reminder');
        }
      }
    }

    // Chạy ngay lập tức khi mở web
    updateClock();
    // Cập nhật lại đồng hồ mỗi 1 giây (1000 mili-giây)
    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="lofi-clock"
      aria-label="Đồng hồ Lofi và nhắc nhở giấc ngủ"
    >
      <div id="current-time">{timeInfo.timeString}</div>
      <div
        id="sleep-reminder"
        className={timeInfo.isSleepTime ? 'show-reminder' : 'hidden-reminder'}
      >
        Khuya rồi, đi ngủ thôi cậu ơi... 🤎
      </div>
    </div>
  );
};

export default LofiClock;
