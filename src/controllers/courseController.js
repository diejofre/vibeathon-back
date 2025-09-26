import { getCourses, getCourse, getCourseWork, getCourseWorkSubmissions, getStudents } from "../services/googleClassroomService.js";

export async function listCourses(req, res) {
  try {
    const data = await getCourses(req.user.accessToken);
    const teacherId = req.user.googleId;
    const courses = (data.courses || []).filter((course) => course.ownerId === teacherId);
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCourseWorkParticipants(req, res) {
  try {
    const { courseId, taskId } = req.params;
    const [subsData, studentsData] = await Promise.all([
      getCourseWorkSubmissions(courseId, taskId, req.user.accessToken),
      getStudents(courseId, req.user.accessToken),
    ]);

    const subs = Array.isArray(subsData) ? subsData : subsData?.studentSubmissions || [];
    const roster = (Array.isArray(studentsData) ? studentsData : studentsData?.students) || [];
    const idToName = new Map(
      roster.map((s) => [String(s.userId || s?.profile?.id), s?.profile?.name?.fullName || "(Sin nombre)"])
    );

    const isSubmitted = (st) => st === "TURNED_IN" || st === "RETURNED";

    // 'Asignadas' ahora significa pendientes (no entregadas)
    const assignedNames = subs
      .filter((s) => !isSubmitted(s?.state))
      .map((s) => idToName.get(String(s.userId)) || "(Desconocido)")
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    const submittedNames = subs
      .filter((s) => isSubmitted(s?.state))
      .map((s) => idToName.get(String(s.userId)) || "(Desconocido)")
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    res.json({ assignedNames, submittedNames });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function listCourseWork(req, res) {
  try {
    const { courseId } = req.params;
    const data = await getCourseWork(courseId, req.user.accessToken);
    const items = Array.isArray(data) ? data : data?.courseWork || [];
    res.json({ courseWork: items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCourseWorkDetail(req, res) {
  try {
    const { courseId, taskId } = req.params;
    const [cwData, subsData] = await Promise.all([
      getCourseWork(courseId, req.user.accessToken),
      getCourseWorkSubmissions(courseId, taskId, req.user.accessToken),
    ]);

    const items = Array.isArray(cwData) ? cwData : cwData?.courseWork || [];
    const task = items.find((x) => String(x.id) === String(taskId));
    const subs = Array.isArray(subsData) ? subsData : subsData?.studentSubmissions || [];

    const submitted = subs.filter((s) => {
      const st = s?.state;
      return st === "TURNED_IN" || st === "RETURNED"; // consideradas entregadas
    }).length;
    const assigned = subs.length - submitted; // ahora 'Asignadas' = pendientes (no entregadas)

    res.json({ task, counts: { assigned, submitted } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCourseById(req, res) {
  try {
    const course = await getCourse(req.params.courseId, req.user.accessToken);
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCourseWorkStats(req, res) {
  try {
    const { courseId } = req.params;
    const data = await getCourseWork(courseId, req.user.accessToken);
    const items = Array.isArray(data) ? data : data?.courseWork || [];

    const total = items.length;
    const byType = items.reduce((acc, cw) => {
      const t = cw.workType || "UNKNOWN";
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    const byState = items.reduce((acc, cw) => {
      const s = cw.state || "UNKNOWN";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    // próximas 5 tareas por dueDate
    const upcoming = items
      .filter((cw) => cw.dueDate)
      .map((cw) => {
        const { dueDate, dueTime } = cw;
        // Construir fecha ISO aproximada (sin zona horaria explícita)
        const yyyy = dueDate.year;
        const mm = String(dueDate.month || 1).padStart(2, "0");
        const dd = String(dueDate.day || 1).padStart(2, "0");
        const HH = String(dueTime?.hours || 0).padStart(2, "0");
        const MM = String(dueTime?.minutes || 0).padStart(2, "0");
        const SS = String(dueTime?.seconds || 0).padStart(2, "0");
        const iso = `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}`;
        return { id: cw.id, title: cw.title, due: iso };
      })
      .sort((a, b) => new Date(a.due) - new Date(b.due))
      .slice(0, 5);

    res.json({ total, byType, byState, upcoming });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
