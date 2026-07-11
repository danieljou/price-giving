export type Section = "francophone" | "anglophone";

export type PrizeCode = "SPECIAL" | "EXC" | "ENC" | "EXC_PLUS";

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          section: Section;
          created_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          date_of_birth?: string | null;
          section: Section;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
        Relationships: [];
      };
      school_years: {
        Row: {
          id: string;
          label: string;
          start_year: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          start_year: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["school_years"]["Insert"]>;
        Relationships: [];
      };
      niveaux: {
        Row: {
          id: string;
          section: Section;
          code: string;
          progression_order: number;
        };
        Insert: {
          id?: string;
          section: Section;
          code: string;
          progression_order: number;
        };
        Update: Partial<Database["public"]["Tables"]["niveaux"]["Insert"]>;
        Relationships: [];
      };
      criteria: {
        Row: {
          id: string;
          prize_code: PrizeCode;
          section: Section;
          niveau_depart: string;
          niveau_admission: string | null;
          moyenne_min: number | null;
          moyenne_max: number | null;
          moyenne_max_inclusive: boolean;
          rang_max: number | null;
          auto_qualify: boolean;
          requires_manual_review: boolean;
          condition_raw: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          prize_code: PrizeCode;
          section: Section;
          niveau_depart: string;
          niveau_admission?: string | null;
          moyenne_min?: number | null;
          moyenne_max?: number | null;
          moyenne_max_inclusive?: boolean;
          rang_max?: number | null;
          auto_qualify?: boolean;
          requires_manual_review?: boolean;
          condition_raw: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["criteria"]["Insert"]>;
        Relationships: [];
      };
      results: {
        Row: {
          id: string;
          student_id: string;
          school_year_id: string;
          section: Section;
          niveau_depart: string;
          niveau_admission: string | null;
          classe_texte: string | null;
          moyenne: number | null;
          rang: number | null;
          awarded_prizes: PrizeCode[];
          criteria_computed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          school_year_id: string;
          section: Section;
          niveau_depart: string;
          niveau_admission?: string | null;
          classe_texte?: string | null;
          moyenne?: number | null;
          rang?: number | null;
          awarded_prizes?: PrizeCode[];
          criteria_computed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["results"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "results_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "results_school_year_id_fkey";
            columns: ["school_year_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
