import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStudentDeleteEq = vi.fn();
const mockResultDeleteEq = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => {
      if (table === "students") {
        return {
          delete: vi.fn(() => ({ eq: mockStudentDeleteEq })),
        };
      }

      if (table === "results") {
        return {
          delete: vi.fn(() => ({ eq: mockResultDeleteEq })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  })),
}));

describe("deleteStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResultDeleteEq.mockReturnValue({ error: null });
    mockStudentDeleteEq.mockReturnValue({ error: null });
  });

  it("supprime d’abord tous les résultats avant l’étudiant", async () => {
    const { deleteStudent } = await import("./actions");

    const result = await deleteStudent("student-1");

    expect(result).toEqual({});
    expect(mockResultDeleteEq).toHaveBeenCalledWith("student-1");
    expect(mockStudentDeleteEq).toHaveBeenCalledWith("student-1");
    expect(mockResultDeleteEq.mock.invocationCallOrder[0]).toBeLessThan(
      mockStudentDeleteEq.mock.invocationCallOrder[0]
    );
  });
});
