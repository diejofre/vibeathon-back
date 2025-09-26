import fetch from "node-fetch";

export async function getCourses(accessToken) {
  const res = await fetch("https://classroom.googleapis.com/v1/courses", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

export async function getCourse(courseId, accessToken) {
  const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

export async function getStudents(courseId, accessToken) {
  const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/students`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

export async function getStudent(courseId, studentId, accessToken) {
  const res = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/students/${studentId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return res.json();
}

export async function getTeacher(courseId, teacherId, accessToken) {
  const res = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/teachers/${teacherId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return res.json();
}

export async function getCourseWork(courseId, accessToken) {
  const res = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return res.json();
}

export async function getCourseWorkSubmissions(courseId, courseWorkId, accessToken) {
  const res = await fetch(
    `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return res.json();
}
