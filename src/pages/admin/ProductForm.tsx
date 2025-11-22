import React, { useState, useEffect } from 'react';
import { Plus, X, Info, Check, Trash2, HelpCircle, AlertCircle, Package, Eye } from 'lucide-react';

// --- TIPOS ---
type Variation = {
  id: string;
  name: string;
  options: string[];
};

type SKU = {
  id: string;
  combinationId: string; // Identificador único da combinação (ex: "Azul-P")
  attributes: { [key: string]: string }; // { "Cor": "Azul", "Tamanho": "P" }
  price: string; // Preço específico desta variação (opcional)
  stock: string; // Quantidade em stock
  skuCode: string; // Código de referência
};

type FormErrors = {
  title?: string;
  basePrice?: string;
  variations?: string;
};

export default function ProductForm() {
  // --- ESTADOS ---
  const [productTitle, setProductTitle] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [installments, setInstallments] = useState('12');
  const [variations, setVariations] = useState<Variation[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  // Estado auxiliar para inputs de novas opções
  const [currentOptionInputs, setCurrentOptionInputs] = useState<{ [key: string]: string }>({});

  // Estado para o Preview (qual opção está selecionada visualmente)
  const [previewSelection, setPreviewSelection] = useState<{ [key: string]: string }>({});

  // --- EFEITO: GERAR SKUs AUTOMATICAMENTE ---
  useEffect(() => {
    generateSKUs();
  }, [variations]);

  const generateSKUs = () => {
    if (variations.length === 0) {
      setSkus([]);
      return;
    }

    // Filtra variações que têm pelo menos uma opção
    const activeVariations = variations.filter(v => v.options.length > 0 && v.name.trim() !== '');
    
    if (activeVariations.length === 0) return;

    // Algoritmo para criar produto cartesiano das opções
    const cartesian = (args: string[][]) => {
      const result: string[][] = [];
      const max = args.length - 1;
      function helper(arr: string[], i: number) {
        for (let j = 0, l = args[i].length; j < l; j++) {
          const a = arr.slice(0);
          a.push(args[i][j]);
          if (i === max) result.push(a);
          else helper(a, i + 1);
        }
      }
      helper([], 0);
      return result;
    };

    const optionsArrays = activeVariations.map(v => v.options);
    const combinations = cartesian(optionsArrays);

    // Cria ou atualiza a lista de SKUs preservando dados existentes
    const newSkus: SKU[] = combinations.map(combo => {
      const attributes: { [key: string]: string } = {};
      let combinationId = '';

      activeVariations.forEach((v, index) => {
        attributes[v.name] = combo[index];
        combinationId += `${combo[index]}-`;
      });

      // Tenta encontrar um SKU existente com essa combinação para manter preço/estoque
      const existingSku = skus.find(s => s.combinationId === combinationId);

      return {
        id: existingSku?.id || Math.random().toString(36).substr(2, 9),
        combinationId,
        attributes,
        price: existingSku?.price || '',
        stock: existingSku?.stock || '0',
        skuCode: existingSku?.skuCode || '',
      };
    });

    setSkus(newSkus);
  };

  // --- MANIPULADORES DE VARIAÇÃO ---
  const addVariation = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setVariations([...variations, { id: newId, name: '', options: [] }]);
  };

  const removeVariation = (id: string) => {
    setVariations(variations.filter(v => v.id !== id));
  };

  const updateVariationName = (id: string, name: string) => {
    setVariations(variations.map(v => v.id === id ? { ...v, name } : v));
  };

  const addOptionToVariation = (variationId: string) => {
    const inputValue = currentOptionInputs[variationId]?.trim();
    if (!inputValue) return;

    setVariations(variations.map(v => {
      if (v.id === variationId && !v.options.includes(inputValue)) {
        return { ...v, options: [...v.options, inputValue] };
      }
      return v;
    }));
    setCurrentOptionInputs({ ...currentOptionInputs, [variationId]: '' });
  };

  const removeOptionFromVariation = (variationId: string, optionToRemove: string) => {
    setVariations(variations.map(v => {
      if (v.id === variationId) {
        return { ...v, options: v.options.filter(o => o !== optionToRemove) };
      }
      return v;
    }));
  };

  // --- MANIPULADORES DE SKU ---
  const updateSkuField = (skuId: string, field: keyof SKU, value: string) => {
    setSkus(skus.map(sku => sku.id === skuId ? { ...sku, [field]: value } : sku));
  };

  // --- VALIDAÇÃO E SALVAR ---
  const handleSave = () => {
    const newErrors: FormErrors = {};
    
    if (!productTitle.trim()) newErrors.title = 'O nome do produto é obrigatório.';
    if (!basePrice) newErrors.basePrice = 'O preço base é obrigatório.';
    
    // Valida se criou variação mas não colocou opções
    const emptyVariations = variations.some(v => v.name && v.options.length === 0);
    if (emptyVariations) newErrors.variations = 'Todas as variações criadas devem ter pelo menos uma opção.';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      alert('Produto pronto para ser salvo! Verifique o console.');
      console.log({ productTitle, basePrice, installments, variations, skus });
    }
  };

  // --- TEMPLATES ---
  const applyTemplate = (type: 'clothes' | 'tech') => {
    const newId1 = Math.random().toString(36).substr(2, 9);
    const newId2 = Math.random().toString(36).substr(2, 9);
    if (type === 'clothes') {
      setVariations([
        { id: newId1, name: 'Tamanho', options: ['P', 'M', 'G'] },
        { id: newId2, name: 'Cor', options: ['Branco', 'Preto'] }
      ]);
    } else if (type === 'tech') {
      setVariations([
        { id: newId1, name: 'Modelo', options: ['iPhone 13', 'iPhone 14'] },
        { id: newId2, name: 'Tipo', options: ['Película 3D', 'Película Privacidade'] }
      ]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Novo Produto</h1>
        <button 
          onClick={handleSave}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center gap-2"
        >
          <Check size={20} />
          Publicar Produto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA DA ESQUERDA: FORMULÁRIO */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. INFORMAÇÕES BÁSICAS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Info size={20} className="text-blue-500" />
              Informações Básicas
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Ex: Capa Protetora Anti-impacto"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Base</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${errors.basePrice ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      placeholder="0,00"
                    />
                  </div>
                  {errors.basePrice && <p className="text-red-500 text-xs mt-1">{errors.basePrice}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parcelamento</label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="1">À vista</option>
                    <option value="3">Até 3x sem juros</option>
                    <option value="6">Até 6x sem juros</option>
                    <option value="12">Até 12x sem juros</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2. VARIAÇÕES */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package size={20} className="text-purple-500" />
                Variações
              </h2>
              <div className="flex gap-2">
                <button onClick={() => applyTemplate('tech')} className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors">
                  + Tech Template
                </button>
                <button onClick={() => applyTemplate('clothes')} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
                  + Roupas Template
                </button>
              </div>
            </div>

            {errors.variations && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} />
                {errors.variations}
              </div>
            )}

            <div className="space-y-6">
              {variations.map((variation) => (
                <div key={variation.id} className="relative p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <button onClick={() => removeVariation(variation.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome (Ex: Cor)</label>
                      <input
                        type="text"
                        value={variation.name}
                        onChange={(e) => updateVariationName(variation.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Opções (Enter para adicionar)</label>
                      <div className="flex flex-wrap gap-2 p-2 bg-white border border-gray-300 rounded-md min-h-[42px]">
                        {variation.options.map((opt) => (
                          <span key={opt} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            {opt}
                            <button onClick={() => removeOptionFromVariation(variation.id, opt)} className="hover:text-purple-900"><X size={12}/></button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={currentOptionInputs[variation.id] || ''}
                          onChange={(e) => setCurrentOptionInputs({...currentOptionInputs, [variationId: variation.id]: e.target.value})}
                          onKeyDown={(e) => e.key === 'Enter' && addOptionToVariation(variation.id)}
                          placeholder="Digite e dê Enter..."
                          className="flex-1 bg-transparent outline-none text-sm min-w-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addVariation} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-500 hover:text-purple-600 flex justify-center items-center gap-2 transition-all">
                <Plus size={20} /> Adicionar Variação
              </button>
            </div>
          </div>

          {/* 3. ESTOQUE / SKUS */}
          {skus.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Estoque e Preços por Variação</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Combinação</th>
                      <th className="px-4 py-3">Preço (Opcional)</th>
                      <th className="px-4 py-3">Estoque</th>
                      <th className="px-4 py-3 rounded-tr-lg">Cód. Ref (SKU)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {skus.map((sku) => (
                      <tr key={sku.combinationId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {Object.values(sku.attributes).join(' / ')}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            placeholder={`Base: R$ ${basePrice || '0'}`}
                            value={sku.price}
                            onChange={(e) => updateSkuField(sku.id, 'price', e.target.value)}
                            className="w-32 px-2 py-1 border border-gray-200 rounded focus:border-blue-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={sku.stock}
                            onChange={(e) => updateSkuField(sku.id, 'stock', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-200 rounded focus:border-blue-500 outline-none"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={sku.skuCode}
                            onChange={(e) => updateSkuField(sku.id, 'skuCode', e.target.value)}
                            className="w-32 px-2 py-1 border border-gray-200 rounded focus:border-blue-500 outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DA DIREITA: PREVIEW */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-2 text-gray-400 mb-4 text-sm uppercase tracking-wider font-bold">
              <Eye size={16} />
              Pré-visualização
            </div>

            <div className="space-y-4">
              {/* Imagem Placeholder */}
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
                <span className="text-4xl">IMG</span>
              </div>

              {/* Título e Preço */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 leading-tight">
                  {productTitle || 'Nome do Produto...'}
                </h3>
                <div className="mt-2 text-2xl font-bold text-green-600">
                  R$ {basePrice || '0,00'}
                  {installments !== '1' && (
                    <span className="block text-xs font-normal text-gray-500">
                      em até {installments}x sem juros
                    </span>
                  )}
                </div>
              </div>

              {/* Seletores de Variação (Interativos) */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                {variations.map(v => v.name && v.options.length > 0 && (
                  <div key={v.id}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{v.name}:</p>
                    <div className="flex flex-wrap gap-2">
                      {v.options.map(opt => {
                        const isSelected = previewSelection[v.name] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => setPreviewSelection({ ...previewSelection, [v.name]: opt })}
                            className={`px-3 py-1 border rounded-md text-sm transition-all ${
                              isSelected 
                                ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-600' 
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-transform active:scale-95">
                  Comprar Agora
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
