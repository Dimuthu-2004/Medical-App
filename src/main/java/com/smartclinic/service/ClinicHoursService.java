package com.smartclinic.service;

import com.smartclinic.model.SessionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ClinicHoursService {

    @Data
    @AllArgsConstructor
    public static class ClinicSession {
        private SessionType type;
        private LocalTime startTime;
        private LocalTime endTime;
        private String displayName;
    }

    public List<ClinicSession> getAvailableSessions(LocalDate date) {
        List<ClinicSession> sessions = new ArrayList<>();
        DayOfWeek day = date.getDayOfWeek();
        LocalTime now = LocalTime.now();
        boolean isToday = date.equals(LocalDate.now());

        if (day == DayOfWeek.SATURDAY) {
            addSessionIfFuture(sessions, SessionType.MORNING, LocalTime.of(6, 30), LocalTime.of(8, 30),
                    "Morning (6:30 AM - 8:30 AM)", isToday, now);
            addSessionIfFuture(sessions, SessionType.EVENING, LocalTime.of(17, 0), LocalTime.of(22, 0),
                    "Evening (5:00 PM - 10:00 PM)", isToday, now);
        } else if (day == DayOfWeek.SUNDAY) {
            addSessionIfFuture(sessions, SessionType.MORNING, LocalTime.of(8, 0), LocalTime.of(10, 0),
                    "Morning (8:00 AM - 10:00 AM)", isToday, now);
            addSessionIfFuture(sessions, SessionType.EVENING, LocalTime.of(15, 0), LocalTime.of(20, 0),
                    "Evening (3:00 PM - 8:00 PM)", isToday, now);
        } else {
            // Monday - Friday
            addSessionIfFuture(sessions, SessionType.MORNING, LocalTime.of(6, 0), LocalTime.of(7, 30),
                    "Morning (6:00 AM - 7:30 AM)", isToday, now);
            addSessionIfFuture(sessions, SessionType.EVENING, LocalTime.of(19, 0), LocalTime.of(22, 0),
                    "Evening (7:00 PM - 10:00 PM)", isToday, now);
        }

        return sessions;
    }

    public SessionType getCurrentSession(LocalDate date, LocalTime time) {
        List<ClinicSession> sessions = getAvailableSessions(date);
        for (ClinicSession session : sessions) {
            if (!time.isAfter(session.getEndTime())) {
                return session.getType();
            }
        }
        return SessionType.MORNING; // Fallback
    }

    private void addSessionIfFuture(List<ClinicSession> sessions, SessionType type, LocalTime start, LocalTime end,
            String display, boolean isToday, LocalTime now) {
        // For staff dashboard, we might want to show all sessions of the day,
        // but for booking we only show future ones. Let's add a parameter.
        sessions.add(new ClinicSession(type, start, end, display));
    }

    public List<ClinicSession> getBookingSessions(LocalDate date) {
        List<ClinicSession> sessions = new ArrayList<>();
        DayOfWeek day = date.getDayOfWeek();
        LocalTime now = LocalTime.now();
        boolean isToday = date.equals(LocalDate.now());

        if (day == DayOfWeek.SATURDAY) {
            addBookingSessionIfFuture(sessions, SessionType.MORNING, LocalTime.of(6, 30), LocalTime.of(8, 30),
                    "Morning (6:30 AM - 8:30 AM)", isToday, now);
            addBookingSessionIfFuture(sessions, SessionType.EVENING, LocalTime.of(17, 0), LocalTime.of(22, 0),
                    "Evening (5:00 PM - 10:00 PM)", isToday, now);
        } else if (day == DayOfWeek.SUNDAY) {
            addBookingSessionIfFuture(sessions, SessionType.MORNING, LocalTime.of(8, 0), LocalTime.of(10, 0),
                    "Morning (8:00 AM - 10:00 AM)", isToday, now);
            addBookingSessionIfFuture(sessions, SessionType.EVENING, LocalTime.of(15, 0), LocalTime.of(20, 0),
                    "Evening (3:00 PM - 8:00 PM)", isToday, now);
        } else {
            addBookingSessionIfFuture(sessions, SessionType.MORNING, LocalTime.of(6, 0), LocalTime.of(7, 30),
                    "Morning (6:00 AM - 7:30 AM)", isToday, now);
            addBookingSessionIfFuture(sessions, SessionType.EVENING, LocalTime.of(19, 0), LocalTime.of(22, 0),
                    "Evening (7:00 PM - 10:00 PM)", isToday, now);
        }
        return sessions;
    }

    private void addBookingSessionIfFuture(List<ClinicSession> sessions, SessionType type, LocalTime start,
            LocalTime end, String display, boolean isToday, LocalTime now) {
        if (!isToday || now.isBefore(start)) {
            sessions.add(new ClinicSession(type, start, end, display));
        }
    }

    public LocalTime getSessionStartTime(SessionType type, DayOfWeek day) {
        if (day == DayOfWeek.SATURDAY) {
            if (type == SessionType.MORNING)
                return LocalTime.of(6, 30);
            if (type == SessionType.EVENING)
                return LocalTime.of(17, 0);
        } else if (day == DayOfWeek.SUNDAY) {
            if (type == SessionType.MORNING)
                return LocalTime.of(8, 0);
            if (type == SessionType.EVENING)
                return LocalTime.of(15, 0);
        } else {
            if (type == SessionType.MORNING)
                return LocalTime.of(6, 0);
            if (type == SessionType.EVENING)
                return LocalTime.of(19, 0);
        }
        return null;
    }
}
