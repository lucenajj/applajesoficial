import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  Alert,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonBase,
  Snackbar,
  Avatar,
  DialogContentText,
  Tooltip
} from '@mui/material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { supabase, Customer, Product, Calculation } from '../lib/supabase';
import { calculateMaterials, CalculationInput, CalculationResult } from '../lib/calculations';
import CalculateIcon from '@mui/icons-material/Calculate';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import RoomIcon from '@mui/icons-material/Room';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ShareIcon from '@mui/icons-material/Share';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type CalculationFormData = {
  customer_id: string;
  house: {
    id?: string;
    name: string;
    address: string;
  };
  areas: Array<{
    id?: string;
    name: string;
    vigota_id: string;
    eps_id: string;
    vigota_width: number;
    vigota_length: number;
    ie: 0.4 | 0.5;
  }>;
};

// Nova função simplificada para calcular o frete corretamente
const calculateCorrectFreight = (areas: any[]): number => {
  if (!areas || areas.length === 0) {
    console.log('Sem áreas para calcular o frete');
    return 0;
  }

  // Constante de custo do frete por metro
  const FREIGHT_COST_PER_METER = 4.646;
  
  console.log("========================");
  console.log("CÁLCULO DE FRETE CORRIGIDO (FINAL)");
  console.log(`Calculando frete para ${areas.length} áreas.`);
  console.log("Dados das áreas recebidos:", areas.map(area => ({
    width: parseFloat(area.vigota_width?.toString() || '0'),
    length: parseFloat(area.vigota_length?.toString() || '0'),
    ie: parseFloat(area.ie?.toString() || '0.5')
  })));
  
  let totalLinearArea = 0;
  
  areas.forEach((area, index) => {
    // Extrair valores com verificação de segurança
    const width = parseFloat(area.vigota_width?.toString() || '0');
    const length = parseFloat(area.vigota_length?.toString() || '0');
    const ie = parseFloat(area.ie?.toString() || '0.5'); // Usar o IE da área ou 0.5 como padrão
    
    // Calcular área linear corretamente como width * length / ie
    const linearArea = width * length / ie;
    totalLinearArea += linearArea;
    
    console.log(`Área ${index + 1}: ${width}m × ${length}m / ${ie} = ${linearArea.toFixed(2)} m² linear`);
  });
  
  console.log(`Área linear total: ${totalLinearArea.toFixed(2)} m²`);
  console.log(`Custo do frete por metro: R$ ${FREIGHT_COST_PER_METER.toFixed(3)}`);
  console.log(`Área linear total: ${totalLinearArea.toFixed(2)} m² x ${FREIGHT_COST_PER_METER.toFixed(3)} = ${(totalLinearArea * FREIGHT_COST_PER_METER).toFixed(2)}`);
  console.log(`FRETE TOTAL CALCULADO: R$ ${(totalLinearArea * FREIGHT_COST_PER_METER).toFixed(2)}`);
  console.log("FIM DO CÁLCULO DE FRETE CORRETO");
  console.log("========================");
  
  // Calcular o custo do frete
  const freightCost = totalLinearArea * FREIGHT_COST_PER_METER;
  
  return freightCost;
};

// Hook para monitorar o tamanho da tela
const useMediaQuery = (width: number) => {
  const [matches, setMatches] = useState(window.innerWidth < width);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${width}px)`);
    const handleResize = () => setMatches(mediaQuery.matches);
    
    // Verificar inicialmente
    setMatches(mediaQuery.matches);
    
    // Adicionar listener para mudanças
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleResize);
      return () => mediaQuery.removeEventListener('change', handleResize);
    } else {
      // Fallback para navegadores mais antigos
      mediaQuery.addListener(handleResize);
      return () => mediaQuery.removeListener(handleResize);
    }
  }, [width]);

  return matches;
};

export const CalculationsPage = () => {
  const isMobile = useMediaQuery(768);
  const isSmallMobile = useMediaQuery(480);
  const [activeStep, setActiveStep] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [houses, setHouses] = useState<any[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<string | null>(null);
  const [areas, setAreas] = useState<any[]>([]);
  const [calculationResults, setCalculationResults] = useState<{[key: string]: CalculationResult}>({});
  const [totalCost, setTotalCost] = useState(0);
  const [totalArea, setTotalArea] = useState(0);
  const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [calculationAreas, setCalculationAreas] = useState<any[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [editingCalculationId, setEditingCalculationId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [calculationToDelete, setCalculationToDelete] = useState<Calculation | null>(null);
  // Adicionar estados para controlar o usuário e sua role
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userData, setUserData] = useState<{role?: string}>({});

  const { control, handleSubmit, reset, watch, setValue, getValues } = useForm<CalculationFormData>({
    defaultValues: {
      customer_id: '',
      house: { name: '', address: '' },
      areas: [{ 
        name: '', 
        vigota_id: '', 
        eps_id: '', 
        vigota_width: 0, 
        vigota_length: 0, 
        ie: 0.5 
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "areas"
  });

  // Obter o usuário atual
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user.id);
        
        // Buscar dados do usuário incluindo a role
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          setUserData(data);
        }
      }
    };
    
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Verificar que temos dados do usuário antes de continuar
        if (!currentUser) {
          return;
        }
        
        // Verificar se o usuário é admin
        const isAdmin = userData?.role === 'admin';
        
        // Primeiro, buscar apenas clientes e produtos (essenciais)
        const [customersResponse, productsResponse] = await Promise.all([
          // Filtrar clientes por vendedor se não for admin
          isAdmin 
            ? supabase.from('customers').select('*')
            : supabase.from('customers').select('*').eq('user_id', currentUser),
          supabase.from('products').select('*'),
        ]);

        if (customersResponse.error) throw new Error(customersResponse.error.message);
        if (productsResponse.error) throw new Error(productsResponse.error.message);

        setCustomers(customersResponse.data || []);
        setProducts(productsResponse.data || []);
        
        // Buscar cálculos filtrados por usuário se não for admin
        const calculationsQuery = isAdmin
          ? supabase.from('calculations').select('*').order('created_at', { ascending: false })
          : supabase.from('calculations').select('*').eq('user_id', currentUser).order('created_at', { ascending: false });
          
        const calculationsResponse = await calculationsQuery;
        
        if (calculationsResponse.error) throw new Error(calculationsResponse.error.message);
        
        setCalculations(calculationsResponse.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Falha ao carregar dados. Por favor, tente novamente mais tarde.');
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser, userData]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchHouses(selectedCustomer);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedHouse) {
      fetchAreas(selectedHouse);
    }
  }, [selectedHouse]);

  const fetchHouses = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHouses(data || []);
    } catch (err) {
      console.error('Error fetching houses:', err);
      setError('Falha ao carregar casas. Por favor, tente novamente mais tarde.');
    }
  };

  const fetchAreas = async (houseId: string) => {
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('house_id', houseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      console.error('Error fetching areas:', err);
      setError('Falha ao carregar áreas. Por favor, tente novamente mais tarde.');
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Função para calcular o frete total somando todas as áreas lineares
  const calculateTotalFreightCost = (data: CalculationFormData, areaResults: {[key: string]: CalculationResult}): number => {
    try {
      // Somar a área linear de todas as áreas
      let totalLinearArea = 0;
      
      // Debug para verificar os dados que estão sendo usados
      console.log('INÍCIO DO CÁLCULO DO FRETE TOTAL');
      console.log(`Calculando frete para ${data.areas.length} áreas.`);
      
      // A área linear é (largura da vigota / ie) * comprimento da vigota
      data.areas.forEach((area, index) => {
        const ie = parseFloat(area.ie.toString());
        const width = parseFloat(area.vigota_width.toString());
        const length = parseFloat(area.vigota_length.toString());
        
        // Calcular a área linear manualmente
        const linearArea = (width / ie) * length;
        totalLinearArea += linearArea;
        
        console.log(`Área ${index + 1} (${area.name || 'Sem nome'}): ${width}m × ${length}m / ${ie} = ${linearArea.toFixed(2)} m² linear`);
      });
      
      // Multiplicar o total da área linear pelo custo do frete por metro
      const freightCostPerMeter = 4.646;
      const totalFreightCost = totalLinearArea * freightCostPerMeter;
      
      console.log(`Área linear total: ${totalLinearArea.toFixed(2)} m²`);
      console.log(`Custo do frete por metro: R$ ${freightCostPerMeter.toFixed(3)}`);
      console.log(`FRETE TOTAL CALCULADO: R$ ${totalFreightCost.toFixed(2)}`);
      console.log('FIM DO CÁLCULO DO FRETE TOTAL');
      
      return totalFreightCost;
    } catch (err) {
      console.error('Erro ao calcular frete total:', err);
      return 0;
    }
  };

  const calculateResults = (data: CalculationFormData) => {
    try {
      // Verificar se temos produtos selecionados
      const hasInvalidProducts = data.areas.some(area => 
        !area.vigota_id || !area.eps_id || area.vigota_width <= 0 || area.vigota_length <= 0
      );
      
      if (hasInvalidProducts) {
        setError('Por favor, preencha todas as informações de produtos e dimensões para cada área.');
        return;
      }
      
      // Calcular para cada área
      let newResults: {[key: string]: CalculationResult} = {};
      let sumTotalCost = 0;
      let sumTotalArea = 0;
      
      // Primeiro calcular os custos de vigota e EPS para cada área
      data.areas.forEach((area, index) => {
        // Encontrar os preços dos produtos selecionados
        const selectedVigota = products.find(p => p.id === area.vigota_id);
        const selectedEps = products.find(p => p.id === area.eps_id);
        
        if (!selectedVigota || !selectedEps) {
          setError('Produtos não encontrados. Por favor, verifique sua seleção.');
          return;
        }
        
        const input: CalculationInput = {
          vigotaLength: area.vigota_length,
          vigotaWidth: area.vigota_width,
          ie: area.ie,
          vigotaPrice: selectedVigota.price,
          epsPrice: selectedEps.price,
          freightCostPerMeter: 4.646, // Valor padrão, pode ser ajustado conforme necessário
          calculateFreight: false // Não calcular frete no cálculo por área
        };
        
        const areaResult = calculateMaterials(input);
        newResults[`area-${index}`] = areaResult;
        
        // Não incluir o frete no cálculo do custo total aqui, pois será calculado separadamente para todas as áreas
        sumTotalCost += (areaResult.vigotaPrice + areaResult.epsPrice);
        // Calcular a área real (largura × comprimento) em vez de usar areaResult.area
        const linearArea = area.vigota_width * area.vigota_length / area.ie;
        sumTotalArea += linearArea;
        console.log(`Área ${index + 1}: Área Linear = ${linearArea.toFixed(2)} m²`);
      });
      
      // Calcular o frete total somando todas as áreas lineares de uma vez só
      console.log('Calculando o frete total para', data.areas.length, 'áreas com o IE selecionado pelo usuário');
      // Usar a função corrigida que respeita o IE do usuário
      const totalFreightCost = calculateCorrectFreight(data.areas);
      
      // Adicionar o frete total ao custo total
      sumTotalCost += totalFreightCost;
      
      console.log('Resultados finais calculados:', {
        numAreas: data.areas.length,
        sumTotalCost: sumTotalCost.toFixed(2),
        sumTotalArea: sumTotalArea.toFixed(2),
        totalFreightCost: totalFreightCost.toFixed(2)
      });
      
      setCalculationResults(newResults);
      setTotalCost(sumTotalCost);
      setTotalArea(sumTotalArea);
      
      // Avançar para a próxima etapa
      handleNext();
    } catch (err) {
      console.error('Erro ao calcular resultados:', err);
      setError('Ocorreu um erro ao calcular os resultados. Por favor, verifique os dados e tente novamente.');
    }
  };

  const saveCalculation = async (data: CalculationFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Obter o usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Erro ao obter usuário atual:', userError);
        setError('Erro ao identificar usuário. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }
      
      if (!user) {
        setError('Usuário não identificado. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }

      // Utilizar o ID do usuário atual para garantir que o cálculo seja associado a ele
      const userId = user.id;
      
      // Verificar se está editando um cálculo existente
      const isEditing = !!editingCalculationId;
      
      // Obter cliente e informações de preço
      const customer = customers.find(c => c.id === data.customer_id);
      if (!customer) {
        setError('Cliente não encontrado. Por favor, selecione um cliente válido.');
        setLoading(false);
        return;
      }
      
      // Calcular totais
      let totalArea = 0;
      for (const area of data.areas) {
        // Calcular área linear (width * length)
        const width = parseFloat(area.vigota_width?.toString() || '0');
        const length = parseFloat(area.vigota_length?.toString() || '0');
        const ie = parseFloat(area.ie?.toString() || '0.5');
        const linearArea = width * length / ie;
        totalArea += linearArea;
        console.log(`Salvando área: ${width}m × ${length}m / ${ie} = ${linearArea.toFixed(2)} m² linear`);
      }
      console.log(`Área linear total a ser salva: ${totalArea.toFixed(2)} m²`);
      
      // Se estiver editando, atualizar o registro existente
      if (isEditing) {
        try {
          console.log('Tentando atualizar cálculo com ID:', editingCalculationId);
          
          // Pegar a primeira área para atualizar os valores principais do cálculo
          const firstArea = data.areas[0];
          const firstAreaResult = calculationResults['area-0'];
          
          if (!firstArea || !firstAreaResult) {
            setError('Dados da área principal não encontrados.');
            setLoading(false);
            return;
          }
          
          // Buscar produtos selecionados
          const selectedVigota = products.find(p => p.id === firstArea.vigota_id);
          const selectedEps = products.find(p => p.id === firstArea.eps_id);
          
          if (!selectedVigota || !selectedEps) {
            setError('Produtos não encontrados. Por favor, verifique sua seleção.');
            setLoading(false);
            return;
          }
          
          // Validar os valores de IE das áreas
          // const validatedAreas = validateAreaIE(data.areas);
          // console.log('Áreas com IE validado para cálculo do frete ao atualizar:', validatedAreas);
          
          // Depois, quando cria updateData, usar as áreas validadas
          const updateData = {
            user_id: userId, // Adicionar o ID do usuário atual
            total_cost: parseFloat(totalCost.toString()),
            cost_per_m2: totalArea > 0 ? parseFloat((totalCost / totalArea).toString()) : 0,
            vigota_width: parseFloat(firstArea.vigota_width.toString()),
            vigota_length: parseFloat(firstArea.vigota_length.toString()),
            vigota_price: parseFloat(selectedVigota.price.toString()),
            eps_price: parseFloat(selectedEps.price.toString()),
            freight_cost: calculateCorrectFreight(data.areas),
            total_area: parseFloat(totalArea.toString())
          };
          
          console.log('Dados de atualização completos:', updateData);
          
          // Atualizar o cálculo com todos os campos
          const { data: updatedCalc, error: updateError } = await supabase
            .from('calculations')
            .update(updateData)
            .eq('id', editingCalculationId)
            .select();
            
          if (updateError) {
            console.error('Erro na atualização de calculations:', updateError);
            setError(`Erro ao atualizar: ${updateError.message}`);
            setLoading(false);
            return;
          }
          
          console.log('Atualização do cálculo bem-sucedida:', updatedCalc);
          
          // Depois de atualizar os campos críticos, tentar atualizar outros campos
          try {
            const { error: moreUpdateError } = await supabase
              .from('calculations')
              .update({
                customer_id: data.customer_id,
                total_area: parseFloat(totalArea.toString()) // Garantir que a área total seja atualizada
              })
              .eq('id', editingCalculationId);
              
            if (moreUpdateError) {
              console.warn('Aviso: Não foi possível atualizar campos adicionais:', moreUpdateError);
            }
          } catch (err) {
            console.warn('Aviso: Erro ao atualizar campos adicionais:', err);
          }
          
          // Atualizar áreas
          try {
            // Excluir áreas existentes
            console.log('Excluindo áreas existentes...');
            await supabase
              .from('calculation_areas')
              .delete()
              .eq('calculation_id', editingCalculationId);
              
            // Adicionar novas áreas uma por uma
            console.log(`Adicionando ${data.areas.length} novas áreas...`);
            
            for (let index = 0; index < data.areas.length; index++) {
              const area = data.areas[index];
              
              const areaData = {
                calculation_id: editingCalculationId,
                name: area.name || `Área ${index + 1}`,
                vigota_width: parseFloat(area.vigota_width.toString()),
                vigota_length: parseFloat(area.vigota_length.toString()),
                vigota_id: area.vigota_id,
                eps_id: area.eps_id,
                ie: parseFloat(area.ie.toString()) as 0.4 | 0.5,
                area: parseFloat((area.vigota_width * area.vigota_length / area.ie).toString()) // Área linear correta
              };
              
              const { error: insertError } = await supabase
                .from('calculation_areas')
                .insert(areaData);
                
              if (insertError) {
                console.warn(`Aviso: Erro ao inserir área ${index + 1}:`, insertError);
              } else {
                console.log(`Atualizando área ${index + 1}: ${area.vigota_width}m × ${area.vigota_length}m = ${(area.vigota_width * area.vigota_length).toFixed(2)} m² linear`);
              }
            }
          } catch (areaErr) {
            console.error('Erro ao processar áreas:', areaErr);
          }
          
          // Limpar estado de edição
          console.log('Edição concluída, limpando estado...');
          setEditingCalculationId(null);
        } catch (err) {
          console.error('Erro inesperado na atualização:', err);
          setError(`Erro ao atualizar cálculo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
          setLoading(false);
          return;
        }
      } else {
        // Se não estiver editando, criar um novo cálculo
        // Verificar se temos um cliente selecionado
        if (!data.customer_id) {
          setError('Por favor, selecione um cliente.');
          setLoading(false);
          return;
        }
        
        // Obter a primeira área para usar como referência para o cálculo principal
        const firstArea = data.areas[0];
        const firstAreaResult = calculationResults['area-0'];
        
        if (!firstArea || !firstAreaResult) {
          setError('Dados de cálculo inválidos. Por favor, calcule os resultados antes de salvar.');
          setLoading(false);
          return;
        }
        
        // Encontrar os produtos selecionados
        const selectedVigota = products.find(p => p.id === firstArea.vigota_id);
        const selectedEps = products.find(p => p.id === firstArea.eps_id);
        
        if (!selectedVigota || !selectedEps) {
          setError('Produtos não encontrados. Por favor, verifique sua seleção.');
          setLoading(false);
          return;
        }
        
        // Verificar se temos uma casa selecionada ou se precisamos criar uma
        let houseId = selectedHouse;
        
        // Se não temos uma casa selecionada e temos dados de casa, criar uma nova
        if (!houseId && (data.house.name || data.house.address)) {
          try {
            const { data: newHouse, error: houseError } = await supabase
              .from('houses')
              .insert({
                customer_id: data.customer_id,
                name: data.house.name || 'Casa sem nome',
                address: data.house.address || ''
              })
              .select()
              .single();
              
            if (houseError) {
              console.error('Erro ao criar casa:', houseError);
            } else if (newHouse) {
              houseId = newHouse.id;
            }
          } catch (houseErr) {
            console.error('Erro ao criar casa:', houseErr);
          }
        }
        
        // Se ainda não temos uma casa e parece ser obrigatória, criar uma temporária
        if (!houseId) {
          try {
            const { data: tempHouse, error: tempHouseError } = await supabase
              .from('houses')
              .insert({
                customer_id: data.customer_id,
                name: 'Casa Temporária',
                address: 'Criada automaticamente para cálculo'
              })
              .select()
              .single();
              
            if (!tempHouseError && tempHouse) {
              houseId = tempHouse.id;
            }
          } catch (tempHouseErr) {
            console.error('Erro ao criar casa temporária:', tempHouseErr);
          }
        }
        
        // Verificar se temos todos os dados essenciais antes de prosseguir
        if (!firstAreaResult.freightCost || !totalCost) {
          // Tentar recalcular os resultados
          calculateResultsForEditing(data);
          
          // Verificar novamente após recálculo
          if (!calculationResults['area-0'] || !totalCost) {
            setError('Não foi possível calcular os custos. Por favor, verifique os valores e tente novamente.');
            setLoading(false);
            return;
          }
        }
        
        // Validar os valores de IE das áreas (se ainda não foi feito acima)
        // const validatedAreas = validateAreaIE(data.areas);
        // console.log('Áreas com IE validado para cálculo do frete ao criar:', validatedAreas);
        
        // Criar o objeto de dados para inserção apenas com as colunas que existem na tabela
        const calculationData = {
          customer_id: data.customer_id,
          house_id: houseId,
          user_id: userId, // Adicionar o ID do usuário atual
          vigota_width: parseFloat(firstArea.vigota_width.toString()),
          vigota_length: parseFloat(firstArea.vigota_length.toString()),
          vigota_price: parseFloat(selectedVigota.price.toString()),
          eps_price: parseFloat(selectedEps.price.toString()),
          freight_cost: calculateCorrectFreight(data.areas),
          total_cost: parseFloat(totalCost.toString()),
          cost_per_m2: totalArea > 0 ? parseFloat((totalCost / totalArea).toString()) : 0,
          total_area: parseFloat(totalArea.toString())
        };
        
        console.log('Dados a serem salvos:', calculationData);
        
        // Inserir o cálculo
        const { data: newCalculation, error: calcError } = await supabase
          .from('calculations')
          .insert(calculationData)
          .select()
          .single();
          
        if (calcError) {
          console.error('Erro ao salvar cálculo:', calcError);
          
          // Verificar se o erro está relacionado a uma coluna específica
          if (calcError.message && calcError.message.includes('violates not-null constraint')) {
            const match = calcError.message.match(/column "([^"]+)"/);
            if (match && match[1]) {
              setError(`O campo "${match[1]}" é obrigatório mas não foi fornecido. Por favor, contate o administrador do sistema.`);
            } else {
              setError(`Um campo obrigatório não foi fornecido: ${calcError.message}`);
            }
          } else {
            setError(`Erro ao salvar: ${calcError.message}`);
          }
          
          setLoading(false);
          return;
        }
        
        // Salvar detalhes de todas as áreas
        if (newCalculation) {
          const areasPromises = data.areas.map(async (area, index) => {
            const areaResult = calculationResults[`area-${index}`];
            if (!areaResult) return null;
            
            const areaData = {
              calculation_id: newCalculation.id,
              name: area.name || `Área ${index + 1}`,
              vigota_width: parseFloat(area.vigota_width.toString()),
              vigota_length: parseFloat(area.vigota_length.toString()),
              vigota_id: area.vigota_id,
              eps_id: area.eps_id,
              ie: parseFloat(area.ie.toString()) as 0.4 | 0.5,
              area: parseFloat((area.vigota_width * area.vigota_length / area.ie).toString()) // Área linear correta
            };
            
            const { error: areaError } = await supabase
              .from('calculation_areas')
              .insert(areaData);
              
            if (areaError) {
              console.error(`Erro ao salvar área ${index + 1}:`, areaError);
            }
            
            return areaData;
          });
          
          await Promise.all(areasPromises);
        }
      }
      
      // Atualizar a lista de cálculos
      const { data: updatedCalculations, error: fetchError } = await supabase
        .from('calculations')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (fetchError) throw fetchError;
      setCalculations(updatedCalculations || []);
      
      setLoading(false);
      // Mostrar mensagem de sucesso
      setError(null);
      const mensagem = isEditing ? 'Orçamento atualizado com sucesso!' : 'Orçamento salvo com sucesso!';
      setSnackbarMessage(mensagem);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Resetar o formulário e voltar para o primeiro passo
      reset();
      setActiveStep(0);
      setCalculationResults({});
      setTotalCost(0);
      setTotalArea(0);
      
    } catch (err) {
      console.error('Erro ao salvar cálculo:', err);
      setError('Ocorreu um erro ao salvar o orçamento. Por favor, tente novamente.');
      setLoading(false);
    }
  };

  // Função para buscar e atualizar a lista de cálculos
  const refreshCalculationsList = async () => {
    try {
      if (!currentUser) return;
      
      // Verificar se o usuário é admin
      const isAdmin = userData?.role === 'admin';
      
      // Filtrar cálculos por usuário se não for admin
      const calculationsQuery = isAdmin
        ? supabase.from('calculations').select('*').order('created_at', { ascending: false })
        : supabase.from('calculations').select('*').eq('user_id', currentUser).order('created_at', { ascending: false });
          
      const { data: updatedCalculations, error } = await calculationsQuery;
          
      if (error) {
        console.error('Erro ao atualizar lista de cálculos:', error);
        return;
      }
      
      setCalculations(updatedCalculations || []);
    } catch (err) {
      console.error('Erro ao buscar cálculos atualizados:', err);
    }
  };

  // Modifica a função handleOpenDetailsDialog para usar o cálculo correto
  const handleOpenDetailsDialog = async (calculation: Calculation) => {
    if (!calculation) {
      console.error('Erro: Tentativa de abrir detalhes com cálculo nulo');
      setSnackbarMessage('Erro ao carregar detalhes do cálculo');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    try {
      // Atualizar a lista de cálculos para garantir que temos os dados mais recentes
      await refreshCalculationsList();
      
      // Buscar a versão mais recente do cálculo diretamente do banco de dados
      const { data: latestCalc, error } = await supabase
        .from('calculations')
        .select('*')
        .eq('id', calculation.id)
        .single();
        
      if (error) {
        console.error('Erro ao buscar dados atualizados do cálculo:', error);
        setSnackbarMessage('Erro ao carregar dados atualizados do cálculo');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
      
      if (latestCalc) {
        console.log('Cálculo atualizado carregado:', latestCalc);
        
        // Carregar áreas relacionadas ao cálculo
        const { data: areasData } = await supabase
          .from('calculation_areas')
          .select('*')
          .eq('calculation_id', latestCalc.id)
          .order('created_at', { ascending: true });
        
        const areas = areasData || [];
        console.log('Áreas carregadas para exibição no modal:', areas);
        
        // Usar as áreas como estão, respeitando o IE selecionado pelo usuário
        setCalculationAreas(areas);
        
        // Calcular área total
        let totalArea = 0;
        areas.forEach(area => {
          const width = parseFloat(area.vigota_width?.toString() || '0');
          const length = parseFloat(area.vigota_length?.toString() || '0');
          const ie = parseFloat(area.ie?.toString() || '0.5'); // Usar o IE da área ou 0.5 como padrão
          
          // Usar width * length / ie para área linear
          const linearArea = width * length / ie;
          totalArea += linearArea;
          console.log(`Área: ${width}m × ${length}m / ${ie} = ${linearArea.toFixed(2)} m² linear`);
        });
        console.log(`Área linear total para exibição no modal: ${totalArea.toFixed(2)} m²`);
        
        // Calcular o frete corretamente usando a nova função - Uma única vez!
        let correctFreightCost = 0;
        if (areas.length > 0) {
          console.log('Calculando frete para exibição no modal com o IE selecionado pelo usuário:');
          correctFreightCost = calculateCorrectFreight(areas);
        } else {
          // Se não tem áreas, usar a área principal com IE do banco
          const mainArea = [{
            vigota_width: latestCalc.vigota_width,
            vigota_length: latestCalc.vigota_length,
            ie: latestCalc.ie  // Usar o IE salvo no banco de dados
          }];
          console.log('Calculando frete para exibição no modal com a área principal:', mainArea);
          correctFreightCost = calculateCorrectFreight(mainArea);
        }
        
        // Garantir que os valores numéricos sejam tratados corretamente
        const processedCalc = {
          ...latestCalc,
          vigota_width: parseFloat(latestCalc.vigota_width?.toString() || '0'),
          vigota_length: parseFloat(latestCalc.vigota_length?.toString() || '0'),
          total_area: totalArea > 0 ? totalArea : parseFloat(latestCalc.total_area?.toString() || '0'),
          total_cost: parseFloat(latestCalc.total_cost?.toString() || '0'),
          cost_per_m2: parseFloat(latestCalc.cost_per_m2?.toString() || '0'),
          vigota_price: parseFloat(latestCalc.vigota_price?.toString() || '0'),
          eps_price: parseFloat(latestCalc.eps_price?.toString() || '0'),
          // Usar o frete calculado corretamente
          freight_cost: correctFreightCost
        };
        
        setSelectedCalculation(processedCalc);
        setDetailsDialogOpen(true);
        
        // Após calcular o frete em handleOpenDetailsDialog, adicionar:
        console.log('=== RESUMO DOS DADOS PARA O MODAL ===');
        console.log(`Áreas carregadas: ${areas.length}`);
        console.log(`Área linear total calculada: ${totalArea.toFixed(2)} m²`);
        console.log(`Frete calculado: R$ ${correctFreightCost.toFixed(2)}`);
        console.log(`Área total do banco: ${latestCalc.total_area || 'N/A'}`);
        console.log(`Custo por m² do banco: ${latestCalc.cost_per_m2 || 'N/A'}`);
        console.log('Dados completos do modal:', {
          customer: customers.find(c => c.id === latestCalc.customer_id)?.name,
          totalArea: totalArea > 0 ? totalArea : parseFloat(latestCalc.total_area?.toString() || '0'),
          totalCost: parseFloat(latestCalc.total_cost?.toString() || '0'),
          costPerM2: parseFloat(latestCalc.cost_per_m2?.toString() || '0'),
          freightCost: correctFreightCost
        });
        console.log('=== FIM DO RESUMO ===');
      } else {
        console.error('Cálculo não encontrado');
        setSnackbarMessage('Erro: Cálculo não encontrado');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Erro ao buscar cálculo atualizado:', err);
      setSnackbarMessage('Erro ao buscar cálculo atualizado');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setCalculationAreas([]);
    
    // Atualizar a lista de cálculos ao fechar o modal para garantir que a tabela mostre os dados mais recentes
    refreshCalculationsList();
  };
  
  const handleEditCalculation = (calculation: Calculation) => {
    if (!calculation) {
      console.error('Erro: Tentativa de editar cálculo nulo');
      setSnackbarMessage('Erro ao carregar dados para edição');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    // Atualizar a lista de cálculos para garantir que temos os dados mais recentes
    refreshCalculationsList();
    
    // Preparar os dados do formulário para edição
    const customerData = customers.find(c => c.id === calculation.customer_id);
    
    if (customerData) {
      // Carregar as áreas novamente para garantir que temos os dados mais recentes
      const fetchAndPrepareAreas = async () => {
        try {
          // Buscar todas as áreas relacionadas a este cálculo
          const { data: areasData, error } = await supabase
            .from('calculation_areas')
            .select('*')
            .eq('calculation_id', calculation.id)
            .order('created_at', { ascending: true });
            
          if (error) {
            console.error('Erro ao carregar áreas para edição:', error);
            setSnackbarMessage('Erro ao carregar áreas para edição. Tente novamente.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
          }
          
          console.log('Áreas carregadas para edição:', areasData);
          
          let areasToEdit = areasData && areasData.length > 0 
            ? areasData.map(area => ({
                name: area.name || '',
                vigota_id: area.vigota_id || '',
                eps_id: area.eps_id || '',
                vigota_width: parseFloat(area.vigota_width?.toString() || '0'),
                vigota_length: parseFloat(area.vigota_length?.toString() || '0'),
                ie: parseFloat(area.ie?.toString() || '0.5') as 0.4 | 0.5,
              })) 
            : [{
                name: 'Área Principal',
                vigota_id: calculation.vigota_id || '',
                eps_id: calculation.eps_id || '',
                vigota_width: parseFloat(calculation.vigota_width?.toString() || '0'),
                vigota_length: parseFloat(calculation.vigota_length?.toString() || '0'),
                ie: parseFloat(calculation.ie?.toString() || '0.5') as 0.4 | 0.5,
              }];
              
          // Configurar os dados do formulário para edição
          reset({
            customer_id: calculation.customer_id,
            house: {
              name: calculation.house_name || '',
              address: calculation.house_address || '',
            },
            areas: areasToEdit
          });
          
          // Fechar o diálogo de detalhes
          handleCloseDetailsDialog();
          
          // Configurar o modo de edição e o ID do cálculo a ser editado
          setEditingCalculationId(calculation.id);
          
          // Ir para o passo de áreas da casa primeiro
          setActiveStep(2);
          
          // Pré-calcular os resultados para cada área após resetar o formulário
          setTimeout(() => {
            const formData = getValues();
            const calculationSuccessful = calculateResultsForEditing(formData);
            console.log('Pré-cálculo realizado:', calculationSuccessful);
          }, 300);
          
          setSnackbarMessage('Editando orçamento. Todas as áreas foram carregadas. Faça as alterações necessárias e avance para calcular novamente.');
          setSnackbarSeverity('info');
          setSnackbarOpen(true);
        } catch (err) {
          console.error('Erro ao preparar dados para edição:', err);
          setSnackbarMessage('Ocorreu um erro ao preparar os dados para edição.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      };
      
      fetchAndPrepareAreas();
    } else {
      setSnackbarMessage('Não foi possível carregar os dados para edição.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Função para calcular os resultados ao editar (similar à calculateResults, mas sem avançar de etapa)
  const calculateResultsForEditing = (data: CalculationFormData) => {
    try {
      // Verificar se temos produtos selecionados
      const hasInvalidProducts = data.areas.some(area => 
        !area.vigota_id || !area.eps_id || area.vigota_width <= 0 || area.vigota_length <= 0
      );
      
      if (hasInvalidProducts) {
        setError('Por favor, preencha todas as informações de produtos e dimensões para cada área.');
        return false;
      }
      
      // Calcular para cada área
      let newResults: {[key: string]: CalculationResult} = {};
      let sumTotalCost = 0;
      let sumTotalArea = 0;
      
      // Primeiro calcular os custos de vigota e EPS para cada área
      data.areas.forEach((area, index) => {
        // Encontrar os preços dos produtos selecionados
        const selectedVigota = products.find(p => p.id === area.vigota_id);
        const selectedEps = products.find(p => p.id === area.eps_id);
        
        if (!selectedVigota || !selectedEps) {
          setError('Produtos não encontrados. Por favor, verifique sua seleção.');
          return;
        }
        
        // Garantir que os valores sejam numéricos
        const vigotaWidth = parseFloat(area.vigota_width.toString());
        const vigotaLength = parseFloat(area.vigota_length.toString());
        const ie = parseFloat(area.ie.toString()) as 0.4 | 0.5;
        
        const input: CalculationInput = {
          vigotaLength,
          vigotaWidth,
          ie,
          vigotaPrice: parseFloat(selectedVigota.price.toString()),
          epsPrice: parseFloat(selectedEps.price.toString()),
          freightCostPerMeter: 4.646, // Valor padrão, pode ser ajustado conforme necessário
          calculateFreight: false // Não calcular frete no cálculo por área
        };
        
        const areaResult = calculateMaterials(input);
        newResults[`area-${index}`] = areaResult;
        
        // Não incluir o frete no cálculo do custo total aqui, pois será calculado separadamente para todas as áreas
        sumTotalCost += (areaResult.vigotaPrice + areaResult.epsPrice);
        const linearArea = vigotaWidth * vigotaLength / ie;
        sumTotalArea += linearArea;
        console.log(`Área ${index + 1}: Área Linear = ${linearArea.toFixed(2)} m²`);
      });
      
      // Calcular o frete total somando todas as áreas lineares de uma vez só
      console.log('Calculando o frete total para edição com', data.areas.length, 'áreas com o IE selecionado pelo usuário');
      // Usar a função corrigida que respeita o IE do usuário
      const totalFreightCost = calculateCorrectFreight(data.areas);
      
      // Adicionar o frete total ao custo total
      sumTotalCost += totalFreightCost;
      
      console.log('Resultados finais calculados para edição:', {
        numAreas: data.areas.length,
        sumTotalCost: sumTotalCost.toFixed(2),
        sumTotalArea: sumTotalArea.toFixed(2),
        totalFreightCost: totalFreightCost.toFixed(2)
      });
      
      setCalculationResults(newResults);
      setTotalCost(sumTotalCost);
      setTotalArea(sumTotalArea);
      
      return true;
    } catch (err) {
      console.error('Erro ao calcular resultados para edição:', err);
      setError('Ocorreu um erro ao calcular os resultados. Por favor, verifique os dados e tente novamente.');
      return false;
    }
  };
  
  const handleOpenShareDialog = () => {
    setShareDialogOpen(true);
  };
  
  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
  };
  
  // Função para gerar PDF atualizada
  const generatePDF = () => {
    if (!selectedCalculation) return;
    
    const doc = new jsPDF();
    const customer = customers.find(c => c.id === selectedCalculation.customer_id);

    // Configurações iniciais
          doc.setFontSize(20);
    doc.text('Orçamento', 105, 15, { align: 'center' });
          
    // Informações do Cliente
          doc.setFontSize(12);
    doc.text('Informações do Cliente', 14, 30);
    doc.setFontSize(10);
    doc.text(`Cliente: ${customer?.name || 'Não informado'}`, 14, 40);
    doc.text(`Data: ${formatDate(selectedCalculation.created_at)}`, 14, 45);
    
    // Detalhes do Cálculo
    doc.setFontSize(12);
    doc.text('Detalhes do Cálculo', 14, 60);
    doc.setFontSize(10);
    doc.text(`Dimensões da Primeira Área: ${selectedCalculation.vigota_width}m × ${selectedCalculation.vigota_length}m`, 14, 70);
    doc.text(`Área Linear Total: ${safeFormat(selectedCalculation.total_area)} m²`, 14, 75);
    
    // Tabela de Áreas
          if (calculationAreas.length > 0) {
      const tableData = calculationAreas.map((area, index) => [
        `Área ${index + 1}`,
        `${area.vigota_width}m × ${area.vigota_length}m`,
        `${safeFormat(parseFloat(area.vigota_width?.toString() || '0') * parseFloat(area.vigota_length?.toString() || '0') / parseFloat(area.ie?.toString() || '0.5'))} m²`,
        area.ie || '0.5'
      ]);

      autoTable(doc, {
        head: [['Área', 'Dimensões', 'Área Linear', 'IE']],
        body: tableData,
        startY: 85,
        theme: 'grid',
        headStyles: { fillColor: [25, 118, 210] }
      });
    }
    
    // Resumo Financeiro
    const finalY = (doc as any).lastAutoTable?.finalY || 85;
    doc.setFontSize(12);
    doc.text('Resumo Financeiro', 14, finalY + 15);
          doc.setFontSize(10);
    
    const financialData = [
      ['Custos', formatCurrency(parseFloat(selectedCalculation.total_cost?.toString() || '0'))],
      ['Preço da Vigota', formatCurrency(parseFloat(selectedCalculation.vigota_price?.toString() || '0'))],
      ['Preço do EPS', formatCurrency(parseFloat(selectedCalculation.eps_price?.toString() || '0'))],
      ['Custo do Frete', formatCurrency(parseFloat(selectedCalculation.freight_cost?.toString() || '0'))],
      ['Custo por m²', formatCurrency(parseFloat(selectedCalculation.cost_per_m2?.toString() || '0'))]
    ];

    autoTable(doc, {
      body: financialData,
      startY: finalY + 20,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 80 }
      }
    });
          
          // Rodapé
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text('Documento gerado em ' + new Date().toLocaleDateString('pt-BR'), 14, pageHeight - 10);
          
          // Salvar o PDF
    doc.save(`orcamento_${selectedCalculation.id}_${formatDate(selectedCalculation.created_at)}.pdf`);
  };
  
  const shareViaWhatsApp = () => {
    if (!selectedCalculation) return;
    
    const customer = customers.find(c => c.id === selectedCalculation.customer_id);
    if (!customer) return;
    
    // Função para formatar valores numéricos com segurança
    const safeFormat = (value: unknown) => {
      if (value == null || isNaN(parseFloat(String(value)))) return '0.00';
      return parseFloat(String(value)).toFixed(2);
    };
    
    // Calcular área total com segurança
    const totalArea = selectedCalculation.total_area != null ? 
      parseFloat(String(selectedCalculation.total_area)) : 
      ((selectedCalculation.vigota_width || 0) * (selectedCalculation.vigota_length || 0));
    
    const totalAreaFormatted = !isNaN(totalArea) ? totalArea.toFixed(2) : '0.00';
    
    const whatsappMessage = encodeURIComponent(
      `*Orçamento AppLajes*\n\n` +
      `Cliente: ${customer.name}\n` +
      `Data: ${selectedCalculation.created_at ? new Date(selectedCalculation.created_at).toLocaleDateString('pt-BR') : 'N/A'}\n` +
      `Dimensões: ${selectedCalculation.vigota_width || 0}m × ${selectedCalculation.vigota_length || 0}m\n` +
      `Área Linear Total: ${totalAreaFormatted} m²\n` +
      `Custo Total: R$ ${safeFormat(selectedCalculation.total_cost)}\n` +
      `Custo por m²: R$ ${safeFormat(selectedCalculation.cost_per_m2)}\n\n` +
      `Obrigado por escolher a AppLajes!`
    );
    
    window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank');
    handleCloseShareDialog();
  };
  
  const shareViaEmail = () => {
    if (!selectedCalculation) return;
    
    const customer = customers.find(c => c.id === selectedCalculation.customer_id);
    if (!customer) return;
    
    // Função para formatar valores numéricos com segurança
    const safeFormat = (value: unknown) => {
      if (value == null || isNaN(parseFloat(String(value)))) return '0.00';
      return parseFloat(String(value)).toFixed(2);
    };
    
    // Calcular área total com segurança
    const totalArea = selectedCalculation.total_area != null ? 
      parseFloat(String(selectedCalculation.total_area)) : 
      ((selectedCalculation.vigota_width || 0) * (selectedCalculation.vigota_length || 0));
    
    const totalAreaFormatted = !isNaN(totalArea) ? totalArea.toFixed(2) : '0.00';
    
    const emailSubject = encodeURIComponent('Orçamento AppLajes');
    const emailBody = encodeURIComponent(
      `Olá ${customer.name},\n\n` +
      `Segue o orçamento solicitado:\n\n` +
      `Data: ${selectedCalculation.created_at ? new Date(selectedCalculation.created_at).toLocaleDateString('pt-BR') : 'N/A'}\n` +
      `Dimensões: ${selectedCalculation.vigota_width || 0}m × ${selectedCalculation.vigota_length || 0}m\n` +
      `Área Linear Total: ${totalAreaFormatted} m²\n` +
      `Custo Total: R$ ${safeFormat(selectedCalculation.total_cost)}\n` +
      `Custo por m²: R$ ${safeFormat(selectedCalculation.cost_per_m2)}\n\n` +
      `Obrigado por escolher a AppLajes!`
    );
    
    window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`, '_blank');
    handleCloseShareDialog();
  };

  const handleDeleteCalculation = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Impede que o clique no botão abra o modal de detalhes
    
    // Encontrar o cálculo pelo ID
    const calculation = calculations.find(calc => calc.id === id);
    if (!calculation) return;
    
    // Definir o cálculo a ser excluído e abrir o diálogo de confirmação
    setCalculationToDelete(calculation);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!calculationToDelete) return;
    
      try {
        // Excluir as áreas relacionadas primeiro
        const { error: areasError } = await supabase
          .from('calculation_areas')
          .delete()
        .eq('calculation_id', calculationToDelete.id);
          
        if (areasError) throw areasError;
        
        // Depois excluir o cálculo
        const { error } = await supabase
          .from('calculations')
          .delete()
        .eq('id', calculationToDelete.id);
          
        if (error) throw error;
        
        // Atualizar a lista de cálculos
      setCalculations(calculations.filter(calc => calc.id !== calculationToDelete.id));
        
        // Usando Snackbar ou Alert em vez de toast
        setSnackbarMessage('Orçamento excluído com sucesso!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      
      // Fechar o diálogo
      setDeleteDialogOpen(false);
      setCalculationToDelete(null);
      } catch (error) {
        console.error('Erro ao excluir orçamento:', error);
        // Usando Snackbar ou Alert em vez de toast
        setSnackbarMessage('Erro ao excluir orçamento. Tente novamente.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCalculationToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Função para cancelar a edição e voltar ao estado normal
  const handleCancelEditing = () => {
    // Limpar o ID de edição
    setEditingCalculationId(null);
    
    // Resetar o formulário para os valores padrão
    reset({
      customer_id: '',
      house: { name: '', address: '' },
      areas: [{ 
        name: '', 
        vigota_id: '', 
        eps_id: '', 
        vigota_width: 0, 
        vigota_length: 0, 
        ie: 0.5 
      }]
    });
    
    // Limpar os resultados de cálculo
    setCalculationResults({});
    setTotalCost(0);
    setTotalArea(0);
    
    // Voltar para o primeiro passo
    setActiveStep(0);
    
    // Mostrar mensagem de cancelamento
    setSnackbarMessage('Edição cancelada.');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
  };

  // Função utilitária para formatar valores numéricos com segurança
  const safeFormat = (value: unknown) => {
    if (value === null || value === undefined) return '0.00';
    if (typeof value === 'number') return value.toFixed(2);
    if (typeof value === 'string') {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.00' : parsedValue.toFixed(2);
    }
    return '0.00';
  };

  // Função para carregar áreas do cálculo sem recalcular o frete
  const fetchCalculationAreas = async (calculationId: string) => {
    try {
      const { data, error } = await supabase
        .from('calculation_areas')
        .select('*')
        .eq('calculation_id', calculationId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Erro ao carregar áreas do cálculo:', error);
        return;
      }
      
      console.log('Áreas do cálculo carregadas:', data);
      setCalculationAreas(data || []);
      
      // Calcular apenas a área total, NÃO calcular o frete
      if (data && data.length > 0) {
        let totalArea = 0;
        
        data.forEach(area => {
          const width = parseFloat(area.vigota_width?.toString() || '0');
          const length = parseFloat(area.vigota_length?.toString() || '0');
          const ie = parseFloat(area.ie?.toString() || '0.5');
          const areaName = area.name || 'Sem nome';
          
          // Usar área linear (width * length)
          const linearArea = width * length / ie;
          totalArea += linearArea;
          console.log(`Área ${areaName} - Área linear: ${width}m × ${length}m / ${ie} = ${linearArea.toFixed(2)} m² linear`);
        });
        
        console.log('Área linear total calculada:', totalArea);
        return {
          areas: data,
          totalArea
        };
      }
      
      return {
        areas: data || [],
        totalArea: 0
      };
    } catch (err) {
      console.error('Erro ao carregar áreas do cálculo:', err);
      return {
        areas: [],
        totalArea: 0
      };
    }
  };

  // Funções auxiliares para formatação
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      px: { xs: 2, sm: 4, md: 6 }, 
      py: 4,
      boxSizing: 'border-box',
    }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
        Cálculos
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Calcule orçamentos para múltiplas áreas de uma casa
      </Typography>
      <Divider sx={{ my: 3 }} />

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {loading && customers.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box 
            sx={{ 
              width: '100%', 
              overflow: 'hidden',
              px: isMobile ? 1 : 3,
              pt: 2
            }}
          >
            <Stepper 
              activeStep={activeStep} 
              sx={{ 
                mb: 4,
                '& .MuiStepLabel-label': {
                  fontSize: isSmallMobile ? '0.75rem' : (isMobile ? '0.875rem' : '1rem'),
                  whiteSpace: 'normal',
                  overflow: 'visible',
                  lineHeight: isSmallMobile ? 1.1 : 1.5,
                },
                '& .MuiStepper-root': {
                  padding: isMobile ? 1 : 2,
                },
                '& .MuiStepConnector-line': {
                  minHeight: isMobile ? 24 : 'auto',
                },
                '& .MuiStepIcon-root': {
                  width: isSmallMobile ? '1rem' : (isMobile ? '1.2rem' : '1.5rem'),
                  height: isSmallMobile ? '1rem' : (isMobile ? '1.2rem' : '1.5rem'),
                  marginRight: isSmallMobile ? '4px' : '8px'
                }
              }} 
              orientation={isMobile ? 'vertical' : 'horizontal'}
              alternativeLabel={!isMobile}
            >
              <Step>
                <StepLabel>{isMobile ? 'Cliente' : 'Selecionar Cliente'}</StepLabel>
              </Step>
              <Step>
                <StepLabel>{isMobile ? 'Casa' : 'Selecionar/Criar Casa'}</StepLabel>
              </Step>
              <Step>
                <StepLabel>{isMobile ? 'Áreas' : 'Adicionar Áreas'}</StepLabel>
              </Step>
              <Step>
                <StepLabel>{isMobile ? 'Resumo' : 'Resultados'}</StepLabel>
              </Step>
            </Stepper>
          </Box>

          <Paper 
            elevation={0} 
            sx={{ 
              p: isMobile ? 2 : 4, 
              border: '1px solid rgba(0,0,0,0.08)', 
              borderRadius: 2,
              mx: isMobile ? 1 : 3
            }}
          >
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Selecionar Cliente
                </Typography>

                {customers.length === 0 ? (
                  <Alert severity="info" sx={{ my: 2 }}>
                    Nenhum cliente encontrado. Por favor, cadastre um cliente primeiro.
                  </Alert>
                ) : (
                  <Controller
                    name="customer_id"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Cliente</InputLabel>
                        <Select 
                          {...field} 
                          label="Cliente"
                          onChange={(e) => {
                            field.onChange(e);
                            setSelectedCustomer(e.target.value);
                          }}
                        >
                          {customers.map((customer) => (
                            <MenuItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleNext}
                    disabled={!watch('customer_id')}
                    sx={{ 
                      px: 4, 
                      py: 1.2, 
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    Próximo
                  </Button>
                </Box>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Selecionar ou Criar Casa
                </Typography>
                
                {houses.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                      Casas Existentes
                    </Typography>
                    <List>
                      {houses.map((house) => (
                        <ListItem 
                          key={house.id} 
                          component="div"
                          onClick={() => setSelectedHouse(house.id)}
                          sx={{
                            cursor: 'pointer',
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: 1,
                            mb: 1,
                            backgroundColor: selectedHouse === house.id ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                            borderLeft: selectedHouse === house.id ? '4px solid #1976d2' : '1px solid rgba(0,0,0,0.08)'
                          }}
                        >
                          <ListItemText 
                            primary={house.name} 
                            secondary={house.address} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Nova Casa
                </Typography>
                
                <Controller
                  name="house.name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nome da Casa"
                      fullWidth
                      margin="normal"
                      placeholder="Ex: Casa Principal, Casa de Praia"
                    />
                  )}
                />

                <Controller
                  name="house.address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Endereço"
                      fullWidth
                      margin="normal"
                      placeholder="Ex: Rua das Flores, 123"
                    />
                  )}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleBack}
                    sx={{ 
                      px: 3, 
                      py: 1.2, 
                      borderRadius: 1,
                      textTransform: 'none'
                    }}
                  >
                    Voltar
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={handleNext}
                    sx={{ 
                      px: 4, 
                      py: 1.2, 
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    Próximo
                  </Button>
                </Box>
              </Box>
            )}

            {activeStep === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Áreas da Casa
                </Typography>
                
                {fields.map((field, index) => (
                  <Accordion 
                    key={field.id} 
                    defaultExpanded={index === 0}
                    sx={{ 
                      mb: 2, 
                      borderRadius: '4px !important',
                      '&:before': { display: 'none' },
                      border: '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        backgroundColor: 'rgba(0,0,0,0.02)', 
                        borderRadius: '4px 4px 0 0'
                      }}
                    >
                      <Typography>
                        {watch(`areas.${index}.name`) || `Área ${index + 1}`}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={{ xs: 2, sm: 3 }}>
                        <Grid item xs={12}>
                          <Controller
                            name={`areas.${index}.name`}
                            control={control}
                            render={({ field }) => (
                              <Autocomplete
                                {...field}
                                freeSolo
                                options={[
                                  'Sala de Estar',
                                  'Sala de Jantar',
                                  'Cozinha',
                                  'Quarto Principal',
                                  'Quarto de Hóspedes',
                                  'Quarto de Criança',
                                  'Banheiro Social',
                                  'Banheiro Suíte',
                                  'Lavabo',
                                  'Área de Serviço',
                                  'Varanda',
                                  'Escritório',
                                  'Garagem'
                                ]}
                                value={field.value || ''}
                                onChange={(_, newValue) => {
                                  field.onChange(newValue);
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Nome da Área"
                                    fullWidth
                                    margin="normal"
                                    placeholder="Ex: Sala, Cozinha, Quarto"
                                  />
                                )}
                              />
                            )}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Controller
                            name={`areas.${index}.vigota_id`}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                              <FormControl fullWidth margin="normal">
                                <InputLabel>Vigota</InputLabel>
                                <Select {...field} label="Vigota">
                                  {products
                                    .filter(p => p.type === 'vigota')
                                    .map((product) => (
                                      <MenuItem key={product.id} value={product.id}>
                                        {product.name}
                                      </MenuItem>
                                    ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Controller
                            name={`areas.${index}.eps_id`}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                              <FormControl fullWidth margin="normal">
                                <InputLabel>EPS</InputLabel>
                                <Select {...field} label="EPS">
                                  {products
                                    .filter(p => p.type === 'eps')
                                    .map((product) => (
                                      <MenuItem key={product.id} value={product.id}>
                                        {product.name}
                                      </MenuItem>
                                    ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Controller
                            name={`areas.${index}.vigota_width`}
                            control={control}
                            rules={{ required: true, min: 0.1 }}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                type="number"
                                label="Vigota (m)"
                                fullWidth
                                margin="normal"
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">m</InputAdornment>,
                                }}
                              />
                            )}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Controller
                            name={`areas.${index}.vigota_length`}
                            control={control}
                            rules={{ required: true, min: 0.1 }}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                type="number"
                                label="Vão (m)"
                                fullWidth
                                margin="normal"
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">m</InputAdornment>,
                                }}
                              />
                            )}
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <Controller
                            name={`areas.${index}.ie`}
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth margin="normal">
                                <InputLabel>IE</InputLabel>
                                <Select {...field} label="IE" defaultValue={0.5}>
                                  <MenuItem value={0.5}>0.50</MenuItem>
                                  <MenuItem value={0.4}>0.40</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>
                      </Grid>
                      
                      {fields.length > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            startIcon={<DeleteIcon />}
                            onClick={() => remove(index)}
                            size="small"
                          >
                            Remover Área
                          </Button>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
                
                <Box sx={{ mt: 2, mb: 4 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={() => append({ 
                      name: '', 
                      vigota_id: '', 
                      eps_id: '', 
                      vigota_width: 0, 
                      vigota_length: 0, 
                      ie: 0.5 
                    })}
                  >
                    Adicionar Área
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Box>
                    <Button 
                      variant="outlined" 
                      onClick={handleBack}
                      sx={{ 
                        px: 3, 
                        py: 1.2, 
                        borderRadius: 1,
                        textTransform: 'none',
                        mr: 1
                      }}
                    >
                      Voltar
                    </Button>
                    {editingCalculationId && (
                      <Button 
                        variant="outlined" 
                        color="error"
                        onClick={handleCancelEditing}
                        sx={{ 
                          px: 3, 
                          py: 1.2, 
                          borderRadius: 1,
                          textTransform: 'none'
                        }}
                      >
                        Cancelar Edição
                      </Button>
                    )}
                  </Box>
                  <Button 
                    variant="contained" 
                    onClick={handleSubmit(calculateResults)}
                    sx={{ 
                      px: 4, 
                      py: 1.2, 
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    Calcular
                  </Button>
                </Box>
              </Box>
            )}
            
            {activeStep === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Resultados do Cálculo
                </Typography>
                
                <Card 
                  elevation={0} 
                  sx={{ 
                    mb: 4, 
                    mt: 1,
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: 2,
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    borderLeft: '4px solid #1976d2'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Resumo Total
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={6}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            backgroundColor: 'white',
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: 2
                          }}
                        >
                          <AttachMoneyIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Custo Total
                          </Typography>
                          <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                            R$ {totalCost.toFixed(2)}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            backgroundColor: 'white',
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: 2
                          }}
                        >
                          <SquareFootIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Custo por m²
                          </Typography>
                          <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                            R$ {totalArea > 0 ? (totalCost / totalArea).toFixed(2) : '0.00'}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Detalhes por Área
                </Typography>
                
                {Object.keys(calculationResults).map((key, index) => {
                  const result = calculationResults[key];
                  const areaName = watch(`areas.${index}.name`) || `Área ${index + 1}`;
                  
                  return (
                    <Accordion 
                      key={key}
                      sx={{ 
                        mb: 2, 
                        borderRadius: '4px !important',
                        '&:before': { display: 'none' },
                        border: '1px solid rgba(0,0,0,0.08)',
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ 
                          backgroundColor: 'rgba(0,0,0,0.02)', 
                          borderRadius: '4px 4px 0 0'
                        }}
                      >
                        <Typography fontWeight="medium">
                          {areaName} - R$ {result.totalCost.toFixed(2)}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="body2" color="text.secondary">Área Linear Total</Typography>
                            <Typography variant="body1" fontWeight="medium">{(watch(`areas.${index}.vigota_width`) * watch(`areas.${index}.vigota_length`) / watch(`areas.${index}.ie`)).toFixed(2)} m² linear</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="body2" color="text.secondary">Vigotas</Typography>
                            <Typography variant="body1" fontWeight="medium">R$ {result.vigotaPrice.toFixed(2)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="body2" color="text.secondary">EPS</Typography>
                            <Typography variant="body1" fontWeight="medium">{result.epsQuantity} unidades - R$ {result.epsPrice.toFixed(2)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="body2" color="text.secondary">Frete</Typography>
                            <Typography variant="body1" fontWeight="medium">R$ {result.freightCost.toFixed(2)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="body2" color="text.secondary">Custo por m²</Typography>
                            <Typography variant="body1" fontWeight="medium">R$ {result.costPerM2.toFixed(2)}</Typography>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Box>
                    <Button 
                      variant="outlined" 
                      onClick={handleBack}
                      sx={{ 
                        px: 3, 
                        py: 1.2, 
                        borderRadius: 1,
                        textTransform: 'none',
                        mr: 1
                      }}
                    >
                      Voltar
                    </Button>
                    {editingCalculationId && (
                      <Button 
                        variant="outlined" 
                        color="error"
                        onClick={handleCancelEditing}
                        sx={{ 
                          px: 3, 
                          py: 1.2, 
                          borderRadius: 1,
                          textTransform: 'none'
                        }}
                      >
                        Cancelar Edição
                      </Button>
                    )}
                  </Box>
                  <Button 
                    variant="contained" 
                    onClick={handleSubmit(saveCalculation)}
                    sx={{ 
                      px: 4, 
                      py: 1.2, 
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    {editingCalculationId ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
          
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Histórico de Cálculos
            </Typography>
            
            {calculations.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                Nenhum cálculo encontrado no histórico.
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 2, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      <TableCell><Typography fontWeight="bold">Cliente</Typography></TableCell>
                      <TableCell><Typography fontWeight="bold">Data</Typography></TableCell>
                      <TableCell align="right"><Typography fontWeight="bold">Dimensões</Typography></TableCell>
                      <TableCell align="right"><Typography fontWeight="bold">Área Linear Total</Typography></TableCell>
                      <TableCell align="right"><Typography fontWeight="bold">Custo Total</Typography></TableCell>
                      <TableCell align="right"><Typography fontWeight="bold">Custo por m²</Typography></TableCell>
                      <TableCell align="center"><Typography fontWeight="bold">Ações</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculations.slice(0, 10).map((calc) => {
                      const customer = customers.find(c => c.id === calc.customer_id);
                      
                      return (
                        <TableRow 
                          key={calc.id} 
                          hover
                          onClick={() => {
                            if (calc && calc.id) {
                              handleOpenDetailsDialog(calc);
                            } else {
                              console.error('Erro: Cálculo inválido ao clicar na linha da tabela');
                              setSnackbarMessage('Erro ao abrir detalhes do cálculo');
                              setSnackbarSeverity('error');
                              setSnackbarOpen(true);
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{customer?.name || 'Cliente não encontrado'}</TableCell>
                          <TableCell>
                            {new Date(calc.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell align="right">
                            {calc.vigota_width != null ? parseFloat(calc.vigota_width.toString()).toFixed(1) : '0.0'}m × {calc.vigota_length != null ? parseFloat(calc.vigota_length.toString()).toFixed(1) : '0.0'}m
                          </TableCell>
                          <TableCell align="right">{
                            // Verificação mais rigorosa para total_area (mostrar área linear)
                            calc.total_area != null && !isNaN(parseFloat(calc.total_area.toString())) 
                              ? parseFloat(calc.total_area.toString()).toFixed(2) 
                              : (
                                  // Verificação mais rigorosa para vigota_width, vigota_length e ie
                                  calc.vigota_width != null && calc.vigota_length != null && calc.ie != null &&
                                  !isNaN(parseFloat(calc.vigota_width.toString())) && 
                                  !isNaN(parseFloat(calc.vigota_length.toString())) &&
                                  !isNaN(parseFloat(calc.ie.toString()))
                                    ? (parseFloat(calc.vigota_width.toString()) * 
                                       parseFloat(calc.vigota_length.toString()) / 
                                       parseFloat(calc.ie.toString())).toFixed(2)
                                    : "0.00"
                                )
                          } m²</TableCell>
                          <TableCell align="right">R$ {calc.total_cost?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell align="right">R$ {calc.cost_per_m2?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell align="center">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={(e) => handleDeleteCalculation(calc.id, e)}
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: 'rgba(211, 47, 47, 0.04)' 
                                } 
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </>
      )}
      
      {/* Modal de Detalhes do Cálculo */}
      <Dialog
        open={detailsDialogOpen && selectedCalculation !== null}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: { xs: '100%', sm: '90vh' },
            overflowY: 'auto'
          }
        }}
      >
        {selectedCalculation ? (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              pb: 2
            }}>
              <Typography variant="h6" component="div" fontWeight="bold">
                Detalhes do Orçamento
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleCloseDetailsDialog}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 } }}>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Informações do Cliente
                      </Typography>
                      {selectedCalculation && (
                        <>
                      <Box sx={{ mt: { xs: 1, sm: 2 } }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          Cliente
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                          {customers.find(c => c.id === selectedCalculation.customer_id)?.name || 'Cliente não encontrado'}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: { xs: 1, sm: 2 } }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          Data do Orçamento
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              {selectedCalculation.created_at ? new Date(selectedCalculation.created_at).toLocaleDateString('pt-BR') : '-'}
                        </Typography>
                      </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Detalhes do Cálculo
                      </Typography>
                      {selectedCalculation && (
                        <>
                      <Box sx={{ mt: { xs: 1, sm: 2 } }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          Dimensões da Primeira Área
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              {selectedCalculation.vigota_width || 0}m × {selectedCalculation.vigota_length || 0}m
                        </Typography>
                      </Box>
                      <Box sx={{ mt: { xs: 1, sm: 2 } }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                              Área Linear Total
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              {safeFormat(selectedCalculation.total_area)} m²
                        </Typography>
                      </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Accordion 
                    elevation={0}
                    sx={{ 
                      border: '1px solid rgba(0,0,0,0.08)',
                      mb: { xs: 1, sm: 2 },
                      '&:before': { display: 'none' },
                      borderRadius: '4px'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        backgroundColor: 'rgba(0,0,0,0.02)', 
                        borderRadius: '4px 4px 0 0',
                        py: { xs: 0.5, sm: 1 }
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Detalhes das Áreas
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ py: { xs: 1, sm: 2 } }}>
                      {selectedCalculation && (
                      <Grid container spacing={2}>
                        {calculationAreas.length > 0 ? (
                          calculationAreas.map((area, index) => (
                            <Grid item xs={12} key={area.id}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                                {area.name || `Área ${index + 1}`}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 0.5, sm: 1 } }}>
                                <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                    Dimensões: {area.vigota_width || 0}m × {area.vigota_length || 0}m
                                </Typography>
                                <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                    Área Linear: {safeFormat(parseFloat(area.vigota_width?.toString() || '0') * parseFloat(area.vigota_length?.toString() || '0') / parseFloat(area.ie?.toString() || '0.5'))} m²
                                </Typography>
                              </Box>
                              {index < calculationAreas.length - 1 && <Divider sx={{ my: 1 }} />}
                            </Grid>
                          ))
                        ) : (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                              Área 1 (Principal)
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: { xs: 0.5, sm: 1 } }}>
                              <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                  Dimensões: {selectedCalculation.vigota_width || 0}m × {selectedCalculation.vigota_length || 0}m
                              </Typography>
                              <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                  Área Linear: {safeFormat((selectedCalculation.vigota_width || 0) * (selectedCalculation.vigota_length || 0) / (selectedCalculation.ie || 0.5))} m²
                              </Typography>
                            </Box>
                            <Divider sx={{ my: { xs: 0.5, sm: 1 } }} />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: { xs: 1, sm: 2 }, fontStyle: 'italic', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                              Não foram encontradas áreas adicionais para este cálculo.
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </Grid>
                
                <Grid item xs={12}>
                  <Card
                    elevation={0}
                    sx={{ 
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderLeft: '4px solid #1976d2',
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    }}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Resumo Financeiro
                      </Typography>
                      {selectedCalculation && (
                      <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Custos
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                              R$ {safeFormat(selectedCalculation.total_cost)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            Preço da Vigota
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              R$ {safeFormat(selectedCalculation.vigota_price)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            Preço do EPS
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              R$ {safeFormat(selectedCalculation.eps_price)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" color="text.secondary">
                            Custo do Frete
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              R$ {safeFormat(selectedCalculation.freight_cost)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="body2" color="text.secondary" fontWeight="bold">
                            Custo por m²
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary" sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                              R$ {safeFormat(selectedCalculation.cost_per_m2)}
                          </Typography>
                        </Grid>
                      </Grid>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 }, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <Button 
                onClick={handleCloseDetailsDialog} 
                color="inherit"
                size="small"
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                Fechar
              </Button>
              <Button 
                onClick={() => handleEditCalculation(selectedCalculation)}
                color="primary"
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                Editar
              </Button>
              <Button 
                onClick={generatePDF} 
                variant="contained" 
                color="primary"
                size="small"
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                Gerar PDF
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
      
      {/* Modal de Compartilhamento */}
      <Dialog
        open={shareDialogOpen}
        onClose={handleCloseShareDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Compartilhar Orçamento
        </DialogTitle>
        <DialogContent>
          <List>
            <ButtonBase 
              onClick={shareViaWhatsApp}
              sx={{ 
                width: '100%', 
                justifyContent: 'flex-start', 
                textAlign: 'left',
                padding: '8px 16px',
                borderRadius: 1
              }}
            >
              <ListItemText 
                primary="WhatsApp" 
                secondary="Compartilhar via WhatsApp"
                sx={{ flex: 1 }}
              />
              <WhatsAppIcon sx={{ color: '#25D366', ml: 2 }} />
            </ButtonBase>
            <ButtonBase 
              onClick={shareViaEmail}
              sx={{ 
                width: '100%', 
                justifyContent: 'flex-start', 
                textAlign: 'left',
                padding: '8px 16px',
                borderRadius: 1
              }}
            >
              <ListItemText 
                primary="E-mail" 
                secondary="Enviar por e-mail"
                sx={{ flex: 1 }}
              />
              <EmailIcon sx={{ color: '#D44638', ml: 2 }} />
            </ButtonBase>
            <ButtonBase 
              onClick={generatePDF}
              sx={{ 
                width: '100%', 
                justifyContent: 'flex-start', 
                textAlign: 'left',
                padding: '8px 16px',
                borderRadius: 1
              }}
            >
              <ListItemText 
                primary="PDF" 
                secondary="Gerar e baixar PDF"
                sx={{ flex: 1 }}
              />
              <PictureAsPdfIcon sx={{ color: '#F40F02', ml: 2 }} />
            </ButtonBase>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShareDialog}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        PaperProps={{
          elevation: 8,
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div" fontWeight="bold">
            Excluir Orçamento
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {calculationToDelete && (
              <>
                Tem certeza que deseja excluir o orçamento 
                {customers.find(c => c.id === calculationToDelete.customer_id)?.name ? 
                  ` do cliente ${customers.find(c => c.id === calculationToDelete.customer_id)?.name}` : 
                  ''}
                {calculationToDelete.created_at ? 
                  ` criado em ${new Date(calculationToDelete.created_at).toLocaleDateString('pt-BR')}` : 
                  ''}?
                <br/><br/>
                Esta ação não pode ser desfeita.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleDeleteCancel}
            variant="outlined"
            sx={{ 
              borderRadius: 1,
              textTransform: 'none'
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained" 
            color="error"
            sx={{ 
              borderRadius: 1,
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};