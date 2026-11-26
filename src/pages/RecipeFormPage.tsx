import React, {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Heart,
  Link2,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {useData} from '../contexts/DataContext';
import {useToast} from '../contexts/ToastContext';
import {createRecipe, getRecipeById, updateRecipe} from '../services/recipeService';
import {getFriendlyErrorMessage} from '../lib/firestoreError';
import {DEFAULT_RECIPE_IMAGE} from '../components/RecipeImage';
import {
  VALIDATION_LIMITS,
  type CookingStep,
  type Ingredient,
  type RecipeFrequency,
} from '../types/models';

function isValidHttpImageUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const RecipeFormPage: React.FC = () => {
  const {id} = useParams<{id: string}>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const {categories} = useData();
  const {showToast} = useToast();

  const [loadingInitial, setLoadingInitial] = useState(isEditing);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [previewFailedUrl, setPreviewFailedUrl] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<RecipeFrequency>('regular');
  const [isFavorite, setIsFavorite] = useState(false);

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    {name: '', quantity: ''},
  ]);
  const [cookingSteps, setCookingSteps] = useState<CookingStep[]>([
    {step: 1, description: ''},
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoadingInitial(true);
    getRecipeById(id)
      .then((recipe) => {
        if (!active) return;
        if (!recipe) {
          showToast('Không tìm thấy công thức để chỉnh sửa.', 'error');
          navigate('/recipes', {replace: true});
          return;
        }
        setName(recipe.name);
        setDescription(recipe.description || '');
        setCoverImage(recipe.coverImage);
        setCategoryId(recipe.categoryId);
        setFrequency(recipe.frequency);
        setIsFavorite(recipe.isFavorite);
        setIngredients(
          recipe.ingredients.length > 0 ? recipe.ingredients : [{name: '', quantity: ''}]
        );
        setCookingSteps(
          recipe.cookingSteps.length > 0
            ? recipe.cookingSteps
            : [{step: 1, description: ''}]
        );
      })
      .catch((error) => {
        if (!active) return;
        showToast(getFriendlyErrorMessage(error, 'Không thể tải dữ liệu công thức.'), 'error');
        navigate('/recipes', {replace: true});
      })
      .finally(() => {
        if (active) setLoadingInitial(false);
      });
    return () => {
      active = false;
    };
  }, [id, navigate, showToast]);

  const validCategoryId =
    categoryId && categories.some((c) => c.id === categoryId) ? categoryId : '';

  const trimmedImageUrl = coverImage.trim();
  const isUrlSyntaxValid = isValidHttpImageUrl(trimmedImageUrl);
  const hasCustomPreview =
    trimmedImageUrl.length > 0 && isUrlSyntaxValid && previewFailedUrl !== trimmedImageUrl;
  const previewSrc = hasCustomPreview ? trimmedImageUrl : DEFAULT_RECIPE_IMAGE;
  const previewBroken =
    trimmedImageUrl.length > 0 && (!isUrlSyntaxValid || previewFailedUrl === trimmedImageUrl);

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    setIngredients((prev) =>
      prev.map((row, idx) => (idx === index ? {...row, [field]: value} : row))
    );
  };

  const addIngredientRow = () => {
    if (ingredients.length >= VALIDATION_LIMITS.INGREDIENTS_MAX_COUNT) return;
    setIngredients((prev) => [...prev, {name: '', quantity: ''}]);
  };

  const removeIngredientRow = (index: number) => {
    setIngredients((prev) =>
      prev.length <= 1 ? [{name: '', quantity: ''}] : prev.filter((_, idx) => idx !== index)
    );
  };

  const moveIngredientRow = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ingredients.length) return;
    setIngredients((prev) => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const updateStep = (index: number, descriptionText: string) => {
    setCookingSteps((prev) =>
      prev.map((row, idx) => (idx === index ? {...row, description: descriptionText} : row))
    );
  };

  const addStepRow = () => {
    if (cookingSteps.length >= VALIDATION_LIMITS.STEPS_MAX_COUNT) return;
    setCookingSteps((prev) => [...prev, {step: prev.length + 1, description: ''}]);
  };

  const removeStepRow = (index: number) => {
    setCookingSteps((prev) => {
      const filtered =
        prev.length <= 1 ? [{step: 1, description: ''}] : prev.filter((_, idx) => idx !== index);
      return filtered.map((s, i) => ({...s, step: i + 1}));
    });
  };

  const moveStepRow = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= cookingSteps.length) return;
    setCookingSteps((prev) => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy.map((s, i) => ({...s, step: i + 1}));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Vui lòng nhập tên món ăn.');
      return;
    }

    if (trimmedImageUrl && !isUrlSyntaxValid) {
      setFormError('Đường link hình ảnh phải bắt đầu bằng https:// hoặc http://.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        description: description.trim(),
        coverImage: trimmedImageUrl,
        coverImagePath: '',
        ingredients,
        cookingSteps,
        categoryId: validCategoryId,
        frequency,
        isFavorite,
      };

      let savedId = id || '';
      if (isEditing && id) {
        await updateRecipe(id, payload);
        showToast('Đã cập nhật công thức thành công.', 'success');
      } else {
        savedId = await createRecipe(payload);
        showToast('Đã thêm công thức mới thành công.', 'success');
      }

      navigate(`/recipes/${savedId}`, {replace: true});
    } catch (error) {
      const msg = getFriendlyErrorMessage(error, 'Không thể lưu công thức.');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#EA580C]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-7 sm:space-y-9">
      {/* Top Breadcrumb + Page Title */}
      <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#EA580C] pb-4">
        <div>
          <Link
            to={isEditing && id ? `/recipes/${id}` : '/recipes'}
            className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold text-[#52524E] hover:text-[#EA580C] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </Link>

          <h1 className="mt-1 font-display text-2xl font-bold text-[#111110] sm:text-4xl">
            {isEditing ? 'Chỉnh sửa công thức' : 'Thêm công thức mới'}
          </h1>
        </div>
      </header>

      {formError && (
        <div
          role="alert"
          className="border border-[#DC2626]/30 bg-[#FEF2F2] px-4 py-3.5 text-sm text-[#991B1B]"
        >
          {formError}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-9 sm:space-y-11">
        {/* ===================================================================== */}
        {/* ROW 1: FULL-WIDTH 2-COLUMN SPLIT (BASIC INFO + IMAGE URL & PREVIEW)   */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Core Dish Details */}
          <section className="space-y-5 lg:col-span-7">
            <div>
              <label htmlFor="recipe-name" className="block text-xs font-semibold text-[#111110]">
                Tên món ăn <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="recipe-name"
                type="text"
                required
                maxLength={VALIDATION_LIMITS.RECIPE_NAME_MAX}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Cá tuyết nướng sốt miso trắng"
                className="mt-2 h-12 w-full rounded-sm border border-[#E4E4E0] bg-[#F7F7F5] px-3.5 text-base text-[#111110] placeholder:text-[#787872] focus:border-[#EA580C] focus:bg-white focus:outline-none transition-colors sm:text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="recipe-description"
                  className="block text-xs font-semibold text-[#111110]"
                >
                  Mô tả món ăn
                </label>
                <span className="text-[11px] font-medium tabular-nums text-[#787872]">
                  {description.length.toLocaleString('vi-VN')} /{' '}
                  {VALIDATION_LIMITS.RECIPE_DESC_MAX.toLocaleString('vi-VN')}
                </span>
              </div>
              <textarea
                id="recipe-description"
                rows={4}
                maxLength={VALIDATION_LIMITS.RECIPE_DESC_MAX}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả hương vị đặc trưng, nguồn gốc món ăn, lưu ý khi thưởng thức hoặc khẩu phần..."
                className="mt-2 w-full rounded-sm border border-[#E4E4E0] bg-[#F7F7F5] p-3.5 text-base leading-relaxed text-[#111110] placeholder:text-[#787872] focus:border-[#EA580C] focus:bg-white focus:outline-none transition-colors sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="recipe-category"
                  className="block text-xs font-semibold text-[#111110]"
                >
                  Danh mục
                </label>
                <select
                  id="recipe-category"
                  value={validCategoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-2 h-12 w-full rounded-sm border border-[#E4E4E0] bg-[#F7F7F5] px-3.5 text-base text-[#111110] focus:border-[#EA580C] focus:bg-white focus:outline-none transition-colors sm:text-sm"
                >
                  <option value="">Chưa phân loại</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#111110]">Tần suất nấu</span>
                <div className="mt-2 grid grid-cols-2 border border-[#E4E4E0] bg-[#F7F7F5] p-0.5">
                  <button
                    type="button"
                    onClick={() => setFrequency('regular')}
                    className={`min-h-[44px] text-xs font-semibold transition-colors ${
                      frequency === 'regular' ? 'bg-[#047857] text-white' : 'text-[#52524E]'
                    }`}
                  >
                    Thường ăn
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('occasional')}
                    className={`min-h-[44px] text-xs font-semibold transition-colors ${
                      frequency === 'occasional' ? 'bg-[#EA580C] text-white' : 'text-[#52524E]'
                    }`}
                  >
                    Ít ăn
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsFavorite((prev) => !prev)}
                aria-pressed={isFavorite}
                className={`inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-sm border px-4 text-xs font-semibold transition-colors sm:w-auto sm:justify-start ${
                  isFavorite
                    ? 'border-[#DC2626] bg-[#DC2626] text-white'
                    : 'border-[#E4E4E0] bg-white text-[#52524E] hover:border-[#DC2626] hover:text-[#DC2626]'
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                <span>{isFavorite ? 'Đã đánh dấu món yêu thích' : 'Đánh dấu món yêu thích'}</span>
              </button>
            </div>
          </section>

          {/* Right Column: Image URL Input + Live Preview */}
          <section className="space-y-3 lg:col-span-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <label htmlFor="recipe-cover-url" className="text-xs font-semibold text-[#111110]">
                Đường link hình ảnh (URL)
              </label>
              <span className="text-[11px] font-medium text-[#787872]">
                Bỏ trống sẽ dùng ảnh mặc định
              </span>
            </div>

            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#EA580C]" />
              <input
                id="recipe-cover-url"
                type="url"
                inputMode="url"
                maxLength={VALIDATION_LIMITS.COVER_IMAGE_URL_MAX}
                value={coverImage}
                onChange={(e) => {
                  setCoverImage(e.target.value);
                  setPreviewFailedUrl(null);
                }}
                placeholder="https://example.com/anh-mon-an.jpg"
                className="h-12 w-full rounded-sm border border-[#E4E4E0] bg-[#F7F7F5] pl-10 pr-11 text-base text-[#111110] placeholder:text-[#787872] focus:border-[#EA580C] focus:bg-white focus:outline-none transition-colors sm:text-sm"
              />
              {coverImage && (
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage('');
                    setPreviewFailedUrl(null);
                  }}
                  aria-label="Xóa đường link ảnh"
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-[#787872] hover:text-[#DC2626]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="overflow-hidden border border-[#E4E4E0] bg-[#F7F7F5]">
              <img
                src={previewSrc}
                alt="Xem trước ảnh đại diện món ăn"
                referrerPolicy="no-referrer"
                onError={() => {
                  if (trimmedImageUrl && previewFailedUrl !== trimmedImageUrl) {
                    setPreviewFailedUrl(trimmedImageUrl);
                  }
                }}
                className="aspect-[16/10] w-full object-cover object-center lg:aspect-[4/3]"
              />
              <div className="flex items-center justify-between gap-2 border-t border-[#E4E4E0] bg-white px-3.5 py-2.5 text-xs">
                {previewBroken ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#DC2626]">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Không tải được ảnh từ link này — sẽ dùng ảnh đại diện mặc định.
                    </span>
                  </span>
                ) : trimmedImageUrl ? (
                  <span className="font-medium text-[#047857]">
                    Đang xem trước ảnh từ đường link đã nhập.
                  </span>
                ) : (
                  <span className="font-medium text-[#52524E]">
                    Đang dùng ảnh đại diện mặc định cho món ăn.
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ===================================================================== */}
        {/* ROW 2: FULL-WIDTH 2-COLUMN SPREAD (INGREDIENTS + COOKING STEPS)       */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 gap-9 border-t-2 border-[#111110] pt-8 lg:grid-cols-12 lg:gap-10">
          {/* Left: Ingredients Editor */}
          <section className="space-y-4 lg:col-span-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#EA580C] pb-3">
              <div>
                <h2 className="font-display text-xl font-bold text-[#111110]">Nguyên liệu</h2>
                <p className="text-xs text-[#787872]">Nhập tên nguyên liệu và định lượng</p>
              </div>
              <button
                type="button"
                onClick={addIngredientRow}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm bg-[#EA580C] px-3.5 text-xs font-semibold text-white hover:bg-[#C2410C] transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm dòng</span>
              </button>
            </div>

            <div className="space-y-3">
              {ingredients.map((row, index) => (
                <div
                  key={index}
                  className="space-y-2 border border-[#E4E4E0] bg-[#FAFAF8] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold tabular-nums text-[#EA580C]">
                      Nguyên liệu {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveIngredientRow(index, -1)}
                        aria-label="Di chuyển lên"
                        className="flex h-9 w-9 items-center justify-center text-[#787872] hover:text-[#111110] disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === ingredients.length - 1}
                        onClick={() => moveIngredientRow(index, 1)}
                        aria-label="Di chuyển xuống"
                        className="flex h-9 w-9 items-center justify-center text-[#787872] hover:text-[#111110] disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeIngredientRow(index)}
                        aria-label="Xóa nguyên liệu"
                        className="flex h-9 w-9 items-center justify-center text-[#787872] hover:text-[#DC2626]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                    <input
                      type="text"
                      maxLength={VALIDATION_LIMITS.INGREDIENT_NAME_MAX}
                      value={row.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      placeholder="Tên nguyên liệu"
                      className="h-11 w-full rounded-sm border border-[#E4E4E0] bg-white px-3 text-base text-[#111110] placeholder:text-[#787872] focus:border-[#EA580C] focus:outline-none sm:col-span-7 sm:text-sm"
                    />
                    <input
                      type="text"
                      maxLength={VALIDATION_LIMITS.INGREDIENT_QTY_MAX}
                      value={row.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      placeholder="Định lượng (vd: 200g)"
                      className="h-11 w-full rounded-sm border border-[#E4E4E0] bg-white px-3 text-base font-semibold text-[#1D4ED8] placeholder:font-normal placeholder:text-[#787872] focus:border-[#1D4ED8] focus:outline-none sm:col-span-5 sm:text-xs"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addIngredientRow}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-sm border border-dashed border-[#EA580C]/60 bg-[#FFF7ED]/50 text-xs font-semibold text-[#EA580C] hover:bg-[#FFF7ED] transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm nguyên liệu</span>
              </button>
            </div>
          </section>

          {/* Right: Cooking Steps Editor */}
          <section className="space-y-4 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1D4ED8] pb-3">
              <div>
                <h2 className="font-display text-xl font-bold text-[#111110]">
                  Các bước chế biến
                </h2>
                <p className="text-xs text-[#787872]">Trình bày rõ từng công đoạn theo thứ tự</p>
              </div>
              <button
                type="button"
                onClick={addStepRow}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm bg-[#1D4ED8] px-3.5 text-xs font-semibold text-white hover:bg-[#1E40AF] transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm bước</span>
              </button>
            </div>

            <div className="space-y-3">
              {cookingSteps.map((row, index) => (
                <div
                  key={index}
                  className="space-y-2 border border-[#E4E4E0] bg-[#FAFAF8] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-xs font-bold tabular-nums text-[#1D4ED8]">
                      <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-[#111110] text-[11px] text-white">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>Bước {String(index + 1).padStart(2, '0')}</span>
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveStepRow(index, -1)}
                        aria-label="Đưa bước lên"
                        className="flex h-9 w-9 items-center justify-center text-[#787872] hover:text-[#111110] disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === cookingSteps.length - 1}
                        onClick={() => moveStepRow(index, 1)}
                        aria-label="Đưa bước xuống"
                        className="flex h-9 w-9 items-center justify-center text-[#787872] hover:text-[#111110] disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStepRow(index)}
                        aria-label="Xóa bước"
                        className="flex h-9 w-9 items-center justify-center text-[#787872] hover:text-[#DC2626]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    maxLength={VALIDATION_LIMITS.STEP_DESC_MAX}
                    value={row.description}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`Mô tả chi tiết bước ${index + 1}...`}
                    className="min-h-[88px] w-full rounded-sm border border-[#E4E4E0] bg-white p-3 text-base leading-relaxed text-[#111110] placeholder:text-[#787872] focus:border-[#1D4ED8] focus:outline-none sm:text-sm"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addStepRow}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-sm border border-dashed border-[#1D4ED8]/60 bg-[#EFF6FF]/60 text-xs font-semibold text-[#1D4ED8] hover:bg-[#EFF6FF] transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm bước chế biến</span>
              </button>
            </div>
          </section>
        </div>

        {/* Full-Width Bottom Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-[#E4E4E0] pt-6 sm:flex-row sm:justify-end">
          <Link
            to={isEditing && id ? `/recipes/${id}` : '/recipes'}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-sm border border-[#E4E4E0] bg-white px-6 text-sm font-semibold text-[#111110] hover:border-[#111110] transition-colors sm:w-auto sm:text-xs"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-sm bg-[#EA580C] px-8 text-sm font-semibold text-white hover:bg-[#C2410C] disabled:opacity-60 transition-colors sm:w-auto sm:text-xs"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isEditing ? 'Cập nhật công thức' : 'Lưu công thức'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
