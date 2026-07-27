import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Star,
  UserRound,
} from "lucide-react";

import {
  createReview,
  listReviews,
} from "../services/domain.service";
import type { ReviewRecord } from "../types/domain";

function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      setReviews(await listReviews());
    } catch {
      setErrorMessage("Não foi possível carregar as avaliações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("pt-BR");

    if (!query) {
      return reviews;
    }

    return reviews.filter((review) =>
      [review.reviewerName, review.reviewedName, review.comment]
        .filter(Boolean)
        .some((value) =>
          String(value).toLocaleLowerCase("pt-BR").includes(query),
        ),
    );
  }, [reviews, searchTerm]);

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
      : 0;

  async function handleCreate() {
    const reviewedName = window.prompt("Quem será avaliado?");

    if (!reviewedName) {
      return;
    }

    const ratingText = window.prompt("Nota de 1 a 5:", "5");
    const rating = Number(ratingText);
    const comment = window.prompt("Comentário:") || undefined;

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      setErrorMessage("Informe uma nota entre 1 e 5.");
      return;
    }

    try {
      await createReview({
        reviewed_name: reviewedName,
        rating,
        comment,
      });

      setSuccessMessage("Avaliação enviada com sucesso.");
      await loadData();
    } catch {
      setErrorMessage("Não foi possível enviar a avaliação.");
    }
  }

  return (
    <div className="domain-page">
      <section className="crud-page__heading">
        <div>
          <span className="dashboard__eyebrow">Qualidade</span>
          <h1>Avaliações</h1>
          <p>Acompanhe o feedback sobre as monitorias realizadas.</p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => void handleCreate()}
        >
          <Plus size={18} />
          Nova avaliação
        </button>
      </section>

      {errorMessage && (
        <div className="crud-feedback crud-feedback--error">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="crud-feedback crud-feedback--success">
          {successMessage}
        </div>
      )}

      <section className="review-summary">
        <div>
          <span className="review-summary__icon">
            <Star size={22} fill="currentColor" />
          </span>

          <div>
            <span>Média geral</span>
            <strong>{average.toFixed(1)}</strong>
          </div>
        </div>

        <div>
          <span className="review-summary__icon">
            <MessageSquareText size={22} />
          </span>

          <div>
            <span>Total de avaliações</span>
            <strong>{reviews.length}</strong>
          </div>
        </div>
      </section>

      <section className="domain-toolbar">
        <div className="crud-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Pesquisar avaliações..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <button
          className="icon-button"
          type="button"
          aria-label="Atualizar"
          onClick={() => void loadData()}
          disabled={loading}
        >
          <RefreshCw
            size={18}
            className={loading ? "icon-spinning" : ""}
          />
        </button>
      </section>

      <section className="review-list">
        {loading && (
          <div className="domain-empty">
            <span className="route-loader__spinner" />
            <p>Carregando avaliações...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="domain-empty">
            <MessageSquareText size={34} />
            <strong>Nenhuma avaliação encontrada</strong>
            <p>As avaliações recebidas aparecerão aqui.</p>
          </div>
        )}

        {!loading &&
          filtered.map((review) => (
            <article className="review-card" key={review.id}>
              <span className="review-card__avatar">
                <UserRound size={20} />
              </span>

              <div className="review-card__content">
                <header>
                  <div>
                    <strong>{review.reviewerName || "Usuário"}</strong>
                    <span>
                      avaliou {review.reviewedName || "um monitor"}
                    </span>
                  </div>

                  <div className="review-stars">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={15}
                        fill={
                          index < Math.round(review.rating)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    ))}
                  </div>
                </header>

                {review.comment && <p>{review.comment}</p>}
                <small>{review.createdAt || "Data não informada"}</small>
              </div>
            </article>
          ))}
      </section>
    </div>
  );
}

export default ReviewsPage;
