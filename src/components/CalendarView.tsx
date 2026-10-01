import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CalendarViewProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  taskDates: Set<string>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  taskDates,
}) => {
  const { colors, isDarkMode } = useTheme();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const renderDays = () => {
    const grid: React.ReactNode[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push(<View key={`empty-${i}`} className="w-[14.28%] h-10 my-0.5" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const monthFormatted = String(currentMonth + 1).padStart(2, '0');
      const dayFormatted = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthFormatted}-${dayFormatted}`;

      const isSelected = selectedDate === dateStr;
      const isToday = now.getDate() === day;
      const hasTask = taskDates.has(dateStr);

      grid.push(
        <TouchableOpacity
          key={dateStr}
          className={`w-[14.28%] h-10 justify-center items-center rounded-xl my-0.5 ${
            isSelected
              ? 'bg-blue-600'
              : isToday
              ? isDarkMode
                ? 'bg-slate-800 border border-blue-500'
                : 'bg-slate-100 border border-blue-500'
              : ''
          }`}
          onPress={() => onSelectDate(dateStr)}
          activeOpacity={0.7}
        >
          <Text
            className={`text-sm ${
              isSelected
                ? 'text-white font-bold'
                : isToday
                ? 'text-blue-600 font-bold'
                : 'font-medium'
            }`}
            style={!isSelected && !isToday ? { color: colors.textPrimary } : undefined}
          >
            {day}
          </Text>
          {hasTask ? (
            <View className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-red-500'}`} />
          ) : null}
        </TouchableOpacity>
      );
    }

    return grid;
  };

  return (
    <View 
      className="rounded-2xl p-4 mb-4 border shadow-sm" 
      style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
    >
      <View className="items-center mb-3">
        <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>
          🗓️ {monthNames[currentMonth]} {currentYear}
        </Text>
      </View>

      <View className="flex-row justify-around mb-2 border-b pb-1.5" style={{ borderBottomColor: colors.borderColor }}>
        {dayNames.map((name) => (
          <Text key={name} className="w-[14.28%] text-center text-xs font-semibold" style={{ color: colors.textSecondary }}>
            {name}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">{renderDays()}</View>
    </View>
  );
};
