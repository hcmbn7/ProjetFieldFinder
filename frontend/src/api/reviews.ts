import type { Review, ReviewCreate } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

const REVIEWS_ENDPOINT = (fieldId: number) =>
  `${API_BASE_URL}/fields/${fieldId}/reviews`;
const USER_REVIEW_ENDPOINT = (fieldId: number, userId: number) =>
  `${REVIEWS_ENDPOINT(fieldId)}/${userId}`;

async function parseError(res: Response): Promise<string> {
  try {
    const payload = await res.json();
    if (payload?.detail) {
      return payload.detail;
    }
    if (typeof payload === "string") {
      return payload;
    }
  } catch (error) {
    console.error("Failed to parse error response", error);
  }
  return res.statusText || "Une erreur est survenue";
}

export async function fetchReviews(fieldId: number): Promise<Review[]> {
  const res = await fetch(REVIEWS_ENDPOINT(fieldId));
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

export async function upsertReview(
  fieldId: number,
  userId: number,
  payload: ReviewCreate
): Promise<Review> {
  const res = await fetch(USER_REVIEW_ENDPOINT(fieldId, userId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}

export async function deleteReview(
  fieldId: number,
  userId: number
): Promise<void> {
  const res = await fetch(USER_REVIEW_ENDPOINT(fieldId, userId), {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
}
