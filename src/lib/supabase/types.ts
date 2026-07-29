export type Section = "francophone" | "anglophone";

export type PrizeCode = "SPECIAL" | "EXC" | "ENC" | "EXC_PLUS";

export type UserRole = "saisie" | "admin";

export type AuditEntityType = "result" | "manual_review" | "prime_config" | "depense";

/** Financial "type de prime" codes — seeded 1:1 with PrizeCode so beneficiary
 *  counts can be derived automatically from results.awarded_prizes, but the
 *  table itself stays editable (libellé/description) and open to new codes. */
export type TypePrimeCode = string;

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
          manual_review_notes: string[];
          manual_review_resolved: boolean;
          notes: string | null;
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
          manual_review_notes?: string[];
          manual_review_resolved?: boolean;
          notes?: string | null;
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
      articles: {
        Row: {
          id: string;
          code: string;
          libelle: string;
          categorie: string;
          description: string | null;
          unite: string;
          prix_reference: number;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          libelle: string;
          categorie: string;
          description?: string | null;
          unite?: string;
          prix_reference?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
        Relationships: [];
      };
      types_primes: {
        Row: {
          id: string;
          code: string;
          libelle: string;
          description: string | null;
          actif: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          libelle: string;
          description?: string | null;
          actif?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["types_primes"]["Insert"]>;
        Relationships: [];
      };
      configurations_primes: {
        Row: {
          id: string;
          session_id: string;
          niveau_id: string;
          type_prime_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          niveau_id: string;
          type_prime_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["configurations_primes"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "configurations_primes_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "configurations_primes_niveau_id_fkey";
            columns: ["niveau_id"];
            isOneToOne: false;
            referencedRelation: "niveaux";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "configurations_primes_type_prime_id_fkey";
            columns: ["type_prime_id"];
            isOneToOne: false;
            referencedRelation: "types_primes";
            referencedColumns: ["id"];
          },
        ];
      };
      configuration_prime_articles: {
        Row: {
          id: string;
          configuration_prime_id: string;
          article_id: string;
          quantite: number;
          prix_session: number;
          montant: number;
          observation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          configuration_prime_id: string;
          article_id: string;
          quantite?: number;
          prix_session?: number;
          observation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["configuration_prime_articles"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "configuration_prime_articles_configuration_prime_id_fkey";
            columns: ["configuration_prime_id"];
            isOneToOne: false;
            referencedRelation: "configurations_primes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "configuration_prime_articles_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      depenses_complementaires: {
        Row: {
          id: string;
          session_id: string;
          libelle: string;
          categorie: string;
          description: string | null;
          montant: number;
          observation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          libelle: string;
          categorie: string;
          description?: string | null;
          montant?: number;
          observation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["depenses_complementaires"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "depenses_complementaires_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "school_years";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          entity_type: AuditEntityType;
          entity_id: string;
          action: string;
          actor_id: string | null;
          actor_email: string | null;
          before: unknown | null;
          after: unknown | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: AuditEntityType;
          entity_id: string;
          action: string;
          actor_id?: string | null;
          actor_email?: string | null;
          before?: unknown | null;
          after?: unknown | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      resolve_manual_review: {
        Args: { p_result_id: string; p_prize_code: string | null };
        Returns: undefined;
      };
      reopen_manual_review: {
        Args: { p_result_id: string };
        Returns: undefined;
      };
      log_audit: {
        Args: {
          p_entity_type: AuditEntityType;
          p_entity_id: string;
          p_action: string;
          p_before: unknown;
          p_after: unknown;
        };
        Returns: undefined;
      };
    };
  };
}
