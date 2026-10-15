import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import Checkbox from "../components/Checkbox";
import Modal from "../components/Modal";
import { signup } from "../api/auth";
import { TERMS } from "../constants/terms";
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirm,
} from "../utils/validation";

const FIELDS = ["email", "password", "passwordConfirm", "name"];
const INITIAL_FORM = { email: "", password: "", passwordConfirm: "", name: "" };
const INITIAL_AGREEMENTS = Object.fromEntries(TERMS.map((t) => [t.key, false]));
const REDIRECT_DELAY_MS = 2500;

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  // 사용자가 손댄 칸만 오류를 보여줘서, 처음부터 빨간 글씨가 뜨지 않게 함
  const [touched, setTouched] = useState({});
  const [agreements, setAgreements] = useState(INITIAL_AGREEMENTS);
  const [openTerm, setOpenTerm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const submittingRef = useRef(false);
  const inputRefs = useRef({});

  const errors = useMemo(
    () => ({
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      passwordConfirm: validatePasswordConfirm(form.password, form.passwordConfirm),
      name: validateName(form.name),
    }),
    [form],
  );

  const allAgreed = TERMS.every((t) => agreements[t.key]);
  const requiredAgreed = TERMS.filter((t) => t.required).every((t) => agreements[t.key]);

  // 가입 완료 후 잠시 환영 메시지를 보여주고 로그인 페이지로 이동
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => navigate("/login", { replace: true }), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [done, navigate]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // 비밀번호 확인은 입력하는 즉시 일치 여부를 보여줌
    if (field === "passwordConfirm") setTouched((prev) => ({ ...prev, passwordConfirm: true }));
    setSubmitError("");
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showError = (field) => (touched[field] ? errors[field] : "");

  const handleAllAgree = (checked) => {
    setAgreements(Object.fromEntries(TERMS.map((t) => [t.key, checked])));
  };

  const handleAgree = (key) => (checked) => {
    setAgreements((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return; // 중복 클릭 방지

    const firstInvalid = FIELDS.find((field) => errors[field]);
    if (firstInvalid) {
      setTouched(Object.fromEntries(FIELDS.map((f) => [f, true])));
      inputRefs.current[firstInvalid]?.focus();
      return;
    }
    if (!requiredAgreed) return;

    submittingRef.current = true;
    setLoading(true);
    setSubmitError("");

    try {
      await signup({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        termsAgreed: requiredAgreed,
        marketingAgreed: agreements.marketing,
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const currentTerm = TERMS.find((t) => t.key === openTerm);

  if (done) {
    return (
      <main className="page">
        <div className="card welcome" role="status">
          <div className="welcome__emoji" aria-hidden="true">
            🍼
          </div>
          <h1 className="welcome__title">{form.name.trim()}님, 가입을 환영해요!</h1>
          <p className="welcome__desc">잠시 후 로그인 페이지로 이동할게요.</p>
          <Button onClick={() => navigate("/login", { replace: true })}>로그인하러 가기</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="card">
        <header className="brand">
          <Link to="/" className="brand__logo">
            모모리
          </Link>
          <p className="brand__welcome">우리 아기의 첫 순간을 함께해요</p>
        </header>

        <h1 className="page-title">회원가입</h1>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <Input
            ref={(el) => (inputRefs.current.email = el)}
            label="이메일"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="momori@email.com"
            value={form.email}
            onChange={handleChange("email")}
            onBlur={handleBlur("email")}
            error={showError("email")}
          />
          <Input
            ref={(el) => (inputRefs.current.password = el)}
            label="비밀번호"
            type="password"
            autoComplete="new-password"
            placeholder="영문, 숫자 포함 8자 이상"
            value={form.password}
            onChange={handleChange("password")}
            onBlur={handleBlur("password")}
            error={showError("password")}
          />
          <Input
            ref={(el) => (inputRefs.current.passwordConfirm = el)}
            label="비밀번호 확인"
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호를 한 번 더 입력해 주세요"
            value={form.passwordConfirm}
            onChange={handleChange("passwordConfirm")}
            onBlur={handleBlur("passwordConfirm")}
            error={showError("passwordConfirm")}
            success={form.passwordConfirm && !errors.passwordConfirm ? "비밀번호가 일치해요" : ""}
          />
          <Input
            ref={(el) => (inputRefs.current.name = el)}
            label="이름"
            autoComplete="name"
            placeholder="이름을 입력해 주세요"
            value={form.name}
            onChange={handleChange("name")}
            onBlur={handleBlur("name")}
            error={showError("name")}
          />

          <hr className="section-divider" />

          <section className="terms" aria-label="약관 동의">
            <div className="terms__all">
              <Checkbox strong checked={allAgreed} onChange={handleAllAgree}>
                전체 동의하기
              </Checkbox>
            </div>
            <ul className="terms__list">
              {TERMS.map((term) => (
                <li key={term.key} className="terms__item">
                  <Checkbox checked={agreements[term.key]} onChange={handleAgree(term.key)}>
                    <span
                      className={`terms__badge ${term.required ? "" : "terms__badge--optional"}`}
                    >
                      [{term.required ? "필수" : "선택"}]
                    </span>{" "}
                    {term.label}
                    {term.description && ` (${term.description})`}
                  </Checkbox>
                  <button
                    type="button"
                    className="terms__view"
                    onClick={() => setOpenTerm(term.key)}
                    aria-label={`${term.label} 내용 보기`}
                  >
                    보기
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {submitError && (
            <p className="form-error" role="alert">
              {submitError}
            </p>
          )}

          <Button type="submit" loading={loading} disabled={!requiredAgreed}>
            {loading ? "가입하는 중이에요" : "가입하기"}
          </Button>
        </form>

        <p className="footer-link">
          이미 회원이신가요?
          <Link to="/login">로그인</Link>
        </p>
      </div>

      <Modal open={Boolean(currentTerm)} title={currentTerm?.label} onClose={() => setOpenTerm(null)}>
        {currentTerm?.content}
      </Modal>
    </main>
  );
}

export default SignupPage;
